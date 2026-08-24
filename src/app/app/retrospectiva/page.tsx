import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { toPlain } from "@/nucleo/sanitizacao";
import { moodOf } from "@/nucleo/humores";
import { levelFromPoints, loveTitle } from "@/nucleo/pontos";
import { unlockedAchievements } from "@/nucleo/conquistas";
import { decodeChatContent } from "@/nucleo/conversa";
import { Retrospectiva, type DadosRetrospectiva } from "@/componentes/Retrospectiva";
import { resolveProvider } from "@/nucleo/chave-ia";
import { callAI } from "@/nucleo/ia";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retrospectiva · Enlace" };

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

type EntryRow = Awaited<ReturnType<typeof fetchEntries>>[number];

async function fetchEntries(where: any, from: Date, to: Date) {
  return prisma.entry.findMany({
    where: { ...where, entryDate: { gte: from, lt: to }, locked: false },
    include: {
      attachments: { select: { id: true, url: true, type: true } },
      reactions: { select: { id: true } },
      comments: { select: { id: true, aiCharacter: true } },
      author: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: { entryDate: "asc" },
  });
}

function computeStats(entries: EntryRow[]) {
  let words = 0;
  let photos = 0;
  let likes = 0;
  let comments = 0;
  let lateNights = 0;
  const moodTally = new Map<string, number>();
  const monthTally = new Array(12).fill(0);
  const authorTally = new Map<string, { name: string; count: number }>();
  const tagTally = new Map<string, number>();
  const places = new Set<string>();
  const placeTally = new Map<string, { count: number; photo: string | null }>();
  const activeDays = new Set<string>();
  const activeMonthKeys = new Set<string>();
  let topEntry: EntryRow | null = null;

  for (const e of entries) {
    const plain = toPlain(e.content);
    words += plain ? plain.split(/\s+/).filter(Boolean).length : 0;
    const firstPhoto = e.attachments.find((a) => a.type === "image")?.url ?? null;
    photos += e.attachments.filter((a) => a.type === "image").length;
    likes += e.reactions.length;
    const humanComments = e.comments.filter((comment) => !comment.aiCharacter).length;
    comments += humanComments;
    if (e.mood) moodTally.set(e.mood, (moodTally.get(e.mood) ?? 0) + 1);

    const d = new Date(e.entryDate);
    monthTally[d.getMonth()]++;
    activeDays.add(d.toISOString().slice(0, 10));
    activeMonthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    // A hora real da publicação, no fuso do app; entryDate pode ter sido
    // escolhida retroativamente e não representa quando a pessoa escreveu.
    const hourPart = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).formatToParts(e.createdAt).find((part) => part.type === "hour")?.value;
    const publishedHour = Number(hourPart ?? 12) % 24;
    if (publishedHour < 5) lateNights++;

    const an = e.author.displayName || e.author.name;
    const cur = authorTally.get(e.author.id) ?? { name: an, count: 0 };
    authorTally.set(e.author.id, { name: an, count: cur.count + 1 });
    try {
      for (const t of JSON.parse(e.tags || "[]")) if (typeof t === "string") tagTally.set(t, (tagTally.get(t) ?? 0) + 1);
    } catch {}
    if (e.place) {
      places.add(e.place);
      const p = placeTally.get(e.place) ?? { count: 0, photo: null };
      placeTally.set(e.place, { count: p.count + 1, photo: p.photo ?? firstPhoto });
    }
    const score = e.reactions.length * 2 + humanComments + (e.favorite ? 5 : 0);
    const topScore = topEntry
      ? topEntry.reactions.length * 2 + topEntry.comments.filter((comment) => !comment.aiCharacter).length + (topEntry.favorite ? 5 : 0)
      : -1;
    if (score > topScore) topEntry = e;
  }

  return {
    words, photos, likes, comments, moodTally, monthTally, authorTally, tagTally, places, topEntry,
    lateNights,
    placeTally,
    bestStreak: longestStreak(activeDays),
    activeMonths: activeMonthKeys.size,
  };
}

/** Maior sequência de dias consecutivos com pelo menos um registro. */
function longestStreak(days: Set<string>): number {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = new Date(`${d}T00:00:00`).getTime();
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    prev = t;
    if (run > best) best = run;
  }
  return best;
}

function buildWrappedData(
  entries: EntryRow[],
  stats: ReturnType<typeof computeStats>,
  year: number,
  me: ReturnType<typeof serializeMe>,
  allTime: boolean,
  capsules: { title: string | null; openAt: Date }[],
): DadosRetrospectiva {
  const { words, photos, likes, comments, moodTally, monthTally, authorTally, tagTally, places, topEntry } = stats;

  const topMoodKey = [...moodTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topMood = moodOf(topMoodKey);
  const busiestMonth = monthTally.indexOf(Math.max(...monthTally));
  const authors = [...authorTally.values()].sort((a, b) => b.count - a.count);
  const topTags = [...tagTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

  const points = me.couple ? me.couple.connectionPoints : me.points;
  const level = levelFromPoints(points);

  const allPhotos = entries.flatMap((e) =>
    e.attachments
      .filter((a) => a.type === "image")
      .map((a) => ({
        url: a.url,
        title: e.title || toPlain(e.content).slice(0, 40) || null,
        date: e.entryDate.toISOString(),
        author: e.author.displayName || e.author.name,
      }))
  );
  const MAX_PHOTOS = 16;
  const step = allPhotos.length > MAX_PHOTOS ? allPhotos.length / MAX_PHOTOS : 1;
  const fotosTimeline = allPhotos.length
    ? Array.from({ length: Math.min(MAX_PHOTOS, allPhotos.length) }, (_, i) => allPhotos[Math.floor(i * step)])
    : [];
  const muralStep = allPhotos.length > 24 ? allPhotos.length / 24 : 1;
  const muralPhotos = allPhotos.length
    ? Array.from({ length: Math.min(24, allPhotos.length) }, (_, index) => allPhotos[Math.floor(index * muralStep)])
    : [];

  const names =
    me.couple?.name ||
    (me.partner ? `${me.displayName || me.name} & ${me.partner.displayName || me.partner.name}` : me.displayName || me.name);

  const daysTogether = me.couple?.anniversary
    ? Math.max(0, Math.floor((Date.now() - new Date(me.couple.anniversary).getTime()) / 86400000))
    : null;

  // Marcos distribuídos pelo período contam a jornada inteira, em vez de
  // concentrar a cena somente nas primeiras memórias.
  const timeline = entries.length
    ? Array.from({ length: Math.min(5, entries.length) }, (_, index) => {
        const amount = Math.min(5, entries.length);
        const position = amount === 1 ? 0 : Math.round((index * (entries.length - 1)) / (amount - 1));
        const entry = entries[position];
        return {
          date: entry.entryDate.toISOString(),
          title: entry.title || toPlain(entry.content).slice(0, 54) || "Uma memória especial",
          photo: entry.attachments.find((attachment) => attachment.type === "image")?.url ?? null,
          author: entry.author.displayName || entry.author.name,
        };
      })
    : [];

  const placeList = [...stats.placeTally.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, value]) => ({ name, count: value.count, photo: value.photo }));

  const achievements = unlockedAchievements({
    total: entries.length,
    words,
    photos,
    likes,
    comments,
    places: places.size,
    capsules: capsules.length,
    daysTogether,
    level,
    bestStreak: stats.bestStreak,
    authorCounts: authors.map((author) => author.count),
    activeMonths: stats.activeMonths,
    lateNights: stats.lateNights,
  });
  const featuredEntry = topEntry && (
    topEntry.favorite ||
    topEntry.reactions.length > 0 ||
    topEntry.comments.some((comment) => !comment.aiCharacter)
  ) ? topEntry : null;

  return {
    year,
    allTime,
    names,
    total: entries.length,
    words,
    photosCount: photos,
    likes,
    comments,
    places: places.size,
    topMood: topMood ? { emoji: topMood.emoji, label: topMood.label, color: topMood.color, count: moodTally.get(topMoodKey!) ?? 0 } : null,
    busiestMonth: entries.length ? { name: MESES[busiestMonth], count: monthTally[busiestMonth] } : null,
    authors: authors.map((a) => ({ name: a.name, count: a.count })),
    topTags,
    level,
    points,
    loveTitle: loveTitle(level),
    daysTogether,
    photos: fotosTimeline,
    topEntry: featuredEntry
      ? {
          title: featuredEntry.title || toPlain(featuredEntry.content).slice(0, 60) || "Uma memória especial",
          excerpt: toPlain(featuredEntry.content).slice(0, 180),
          author: featuredEntry.author.displayName || featuredEntry.author.name,
          photo: featuredEntry.attachments.find((a) => a.type === "image")?.url ?? null,
          likes: featuredEntry.reactions.length,
        }
      : null,
    metDate: me.couple?.metDate ? new Date(me.couple.metDate).toISOString() : null,
    anniversary: me.couple?.anniversary ? new Date(me.couple.anniversary).toISOString() : null,
    coupleName: me.couple?.name ?? null,
    questions: [],
    allPhotos: muralPhotos,
    capsules: capsules.map((capsule) => ({ title: capsule.title, openAt: capsule.openAt.toISOString() })),
    achievements,
    timeline,
    placeList,
    lateNights: stats.lateNights,
    bestStreak: stats.bestStreak,
    activeMonths: stats.activeMonths,
    firstEntry: entries[0]
      ? {
          title: entries[0].title || toPlain(entries[0].content).slice(0, 60) || "A primeira memória",
          date: entries[0].entryDate.toISOString(),
          author: entries[0].author.displayName || entries[0].author.name,
          photo: entries[0].attachments.find((attachment) => attachment.type === "image")?.url ?? null,
        }
      : null,
  };
}

async function fetchAppStats(coupleId: string, from?: Date, to?: Date): Promise<NonNullable<DadosRetrospectiva["appStats"]>> {
  const createdAt = from && to ? { gte: from, lt: to } : undefined;
  const period = createdAt ? { createdAt } : {};
  const messageWhere = { coupleId, ...period };

  // O total usa COUNT no banco. Só mensagens com payload de anexo precisam
  // ser decodificadas, evitando carregar todo o histórico de textos na RAM.
  const [messageCount, mediaRows, taskRows, wishRows, goalRows, gameRows, gameScores, surprises] = await Promise.all([
    prisma.message.count({ where: messageWhere }).catch(() => 0),
    prisma.message.findMany({
      where: { ...messageWhere, content: { startsWith: "__enlace_chat_v1__:" } },
      select: { content: true },
      take: 2500,
    }).catch(() => []),
    prisma.taskItem.findMany({ where: { list: { coupleId }, ...period }, select: { done: true } }).catch(() => []),
    prisma.wish.findMany({ where: { coupleId, ...period }, select: { done: true } }).catch(() => []),
    prisma.goal.findMany({ where: { coupleId, ...period }, select: { done: true } }).catch(() => []),
    prisma.gameSession.findMany({
      where: { coupleId, status: "finished", ...period },
      select: { game: true },
    }).catch(() => []),
    prisma.gameScore.findMany({ where: { coupleId, ...period }, select: { game: true, points: true, dia: true } }).catch(() => []),
    prisma.secret.count({ where: { coupleId, ...period } }).catch(() => 0),
  ]);

  const gameTally = new Map<string, number>();
  const gameSource = gameRows.length ? gameRows : gameScores;
  for (const game of gameSource) gameTally.set(game.game, (gameTally.get(game.game) ?? 0) + 1);
  const favoriteGame = [...gameTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const scoredRounds = new Set(gameScores.map((score) => `${score.game}:${score.dia}`)).size;

  const chatMedia = { images: 0, audios: 0, videos: 0, files: 0 };
  for (const message of mediaRows) {
    for (const attachment of decodeChatContent(message.content).attachments) {
      if (attachment.type === "image") chatMedia.images++;
      else if (attachment.type === "audio") chatMedia.audios++;
      else if (attachment.type === "video") chatMedia.videos++;
      else chatMedia.files++;
    }
  }

  return {
    chatMessages: messageCount,
    chatMedia,
    tasksCreated: taskRows.length,
    tasksDone: taskRows.filter((task) => task.done).length,
    wishesCreated: wishRows.length,
    wishesDone: wishRows.filter((wish) => wish.done).length,
    goalsCreated: goalRows.length,
    goalsDone: goalRows.filter((goal) => goal.done).length,
    gamesPlayed: gameRows.length || scoredRounds,
    gamePoints: gameScores.reduce((sum, score) => sum + score.points, 0),
    favoriteGame,
    capsules: 0,
    surprises,
  };
}

function hasAppActivity(stats: NonNullable<DadosRetrospectiva["appStats"]>): boolean {
  return stats.chatMessages + stats.tasksCreated + stats.wishesCreated + stats.goalsCreated +
    stats.gamesPlayed + stats.gamePoints + stats.surprises > 0;
}

export default async function RetrospectivaPage({
  searchParams,
}: {
  searchParams: { ano?: string; semestre?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);

  const now = new Date();
  const nowYear = now.getFullYear();
  const currentSemester = now.getMonth() < 6 ? 1 : 2;

  const parsedYear = searchParams.ano ? Number(searchParams.ano) : nowYear;
  const parsedSemester = searchParams.semestre ? Number(searchParams.semestre) : currentSemester;
  const validYear = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= nowYear + 1;
  const validSemester = parsedSemester === 1 || parsedSemester === 2;
  const year = validYear ? parsedYear : nowYear;
  const sem = validSemester ? parsedSemester : currentSemester;
  if ((searchParams.ano && !validYear) || (searchParams.semestre && !validSemester)) {
    redirect(`/app/retrospectiva?ano=${year}&semestre=${sem}`);
  }

  // Uma retrospectiva compartilhável nunca inclui memória privada. Para quem
  // ainda está solo, usa somente as próprias memórias.
  const base = user.coupleId
    ? { coupleId: user.coupleId, visibility: "shared" }
    : { authorId: user.id };

  // ── Semestre selecionado ──
  const sFrom = sem === 1 ? new Date(year, 0, 1) : new Date(year, 6, 1);
  const sTo = sem === 1 ? new Date(year, 6, 1) : new Date(year + 1, 0, 1);

  let entries = await fetchEntries(base, sFrom, sTo);
  let capsuleRows = user.coupleId
    ? await prisma.capsule.findMany({
        where: { coupleId: user.coupleId, createdAt: { gte: sFrom, lt: sTo } },
        select: { title: true, openAt: true },
        orderBy: { openAt: "asc" },
      })
    : [];
  let appStats = user.coupleId ? await fetchAppStats(user.coupleId, sFrom, sTo) : null;

  // Só recua para a história completa quando TODO o app ficou vazio no
  // período. Mensagens, tarefas ou jogos do semestre não viram "todos os
  // tempos" apenas porque não houve uma memória no diário.
  let allTime = false;
  const periodIsEmpty = entries.length === 0 && capsuleRows.length === 0 && (!appStats || !hasAppActivity(appStats));
  if (periodIsEmpty) {
    allTime = true;
    entries = await prisma.entry.findMany({
      where: { ...base, locked: false },
      include: {
        attachments: { select: { id: true, url: true, type: true } },
        reactions: { select: { id: true } },
        comments: { select: { id: true, aiCharacter: true } },
        author: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: { entryDate: "asc" },
    });
    if (user.coupleId) {
      capsuleRows = await prisma.capsule.findMany({
        where: { coupleId: user.coupleId },
        select: { title: true, openAt: true },
        orderBy: { openAt: "asc" },
      });
      appStats = await fetchAppStats(user.coupleId);
    }
  }

  const stats = computeStats(entries);
  const data = buildWrappedData(entries, stats, year, me, allTime, capsuleRows);
  if (appStats) data.appStats = { ...appStats, capsules: capsuleRows.length };

  // ── Brincadeiras com dados reais do casal ──
  // Roleta: os desejos/ideias de encontro do casal viram as fatias.
  if (user.coupleId) {
    const wishes = await prisma.wish
      .findMany({
        where: { coupleId: user.coupleId, done: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { title: true },
      })
      .catch(() => []);
    const opts = wishes.map((w) => w.title).filter(Boolean);
    if (opts.length >= 2) data.roletaOptions = opts;
  }
  // Wordle: a tag mais usada do casal, se for uma palavra "adivinhável".
  const topTag = data.topTags[0];
  if (topTag && /^[a-zA-ZÀ-ÿ]{3,8}$/.test(topTag)) {
    data.wordleWord = topTag;
  }

  // ── Resumo do outro semestre ──
  const otherSem = sem === 1 ? 2 : 1;
  const oFrom = otherSem === 1 ? new Date(year, 0, 1) : new Date(year, 6, 1);
  const oTo = otherSem === 1 ? new Date(year, 6, 1) : new Date(year + 1, 0, 1);

  let otherSummary: { total: number; topMoodLabel?: string; topMoodEmoji?: string } | null = null;

  if (!allTime) {
    const otherEntries = await fetchEntries(base, oFrom, oTo);
    if (otherEntries.length > 0) {
      const otherStats = computeStats(otherEntries);
      const otherTopMoodKey = [...otherStats.moodTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const otherMood = otherTopMoodKey ? moodOf(otherTopMoodKey) : null;
      otherSummary = {
        total: otherEntries.length,
        topMoodLabel: otherMood?.label,
        topMoodEmoji: otherMood?.emoji,
      };
    }
  }

  // ── Músicas salvas ──
  let savedSongs: any[] = [];
  if (user.coupleId) {
    savedSongs = await prisma.retroMusic.findMany({
      where: { coupleId: user.coupleId, year, semester: sem },
      orderBy: { createdAt: "asc" },
    });
  }

  // ── Enriquecimentos por IA (música + perguntas) ──
  // Rodam em PARALELO e com prazo curto. Antes eram dois awaits em série de
  // modelos que "pensam", e a retrospectiva levava ~47s para abrir. Agora, se
  // a IA demorar, a página abre mesmo assim com os fallbacks.
  const FALLBACK_QUESTIONS: { for: string; name: string; q: string; options: string[] }[] = [
    { for: "me", name: me.displayName || me.name, q: "Qual foi o momento mais marcante desse período?", options: ["Uma viagem", "Uma conversa especial", "Um gesto inesperado", "Uma superação"] },
    { for: "partner", name: me.partner?.displayName || me.partner?.name || "Seu amor", q: "O que mais fez juntos nesse período?", options: ["Cozinhar", "Assistir filmes", "Passear", "Conversar até tarde"] },
    { for: "me", name: me.displayName || me.name, q: "Qual palavra define esse semestre?", options: ["Cumplicidade", "Aventura", "Crescimento", "Carinho"] },
    { for: "partner", name: me.partner?.displayName || me.partner?.name || "Seu amor", q: "O que mais te surpreendeu?", options: ["Um presente", "Uma atitude", "Uma declaração", "Um plano"] },
  ];

  let aiSong: { name: string; artist: string } | null = null;

  const { provider, apiKey } = resolveProvider(user);
  if (apiKey && !allTime) {
    const myName = me.displayName || me.name;
    const partnerName = me.partner?.displayName || me.partner?.name || "Seu amor";

    const songTask = async () => {
      if (entries.length < 3) return;
      const topMoodKey = [...stats.moodTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const summary = [
        `Período: ${sem}º semestre de ${year}`,
        `Memórias: ${entries.length}`,
        `Palavras escritas: ${stats.words}`,
        topMoodKey ? `Clima mais frequente: ${moodOf(topMoodKey)?.label}` : "",
        `Nomes: ${data.names}`,
      ].filter(Boolean).join(". ");
      const reply = await callAI({
        provider,
        apiKey,
        model: user.aiModel || undefined,
        system:
          "Você sugere músicas românticas para casais com base nas memórias deles. " +
          'Responda APENAS um JSON: {"name":"Nome da música","artist":"Nome do artista"}. ' +
          "Escolha músicas brasileiras conhecidas e românticas. Seja criativo e pessoal.",
        messages: [{ role: "user", content: summary }],
        maxTokens: 120,
        temperature: 0.9,
      });
      const m = reply.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed.name && parsed.artist) aiSong = { name: parsed.name, artist: parsed.artist };
      }
    };

    const questionsTask = async () => {
      if (entries.length < 2) return;
      const myEntries = entries.filter((e) => e.authorId === user.id).slice(0, 6);
      const partnerEntries = entries.filter((e) => e.authorId !== user.id).slice(0, 6);
      const myDigest = myEntries.map((e) => `- ${e.title || toPlain(e.content).slice(0, 60)}`).join("\n");
      const partnerDigest = partnerEntries.map((e) => `- ${e.title || toPlain(e.content).slice(0, 60)}`).join("\n");
      const reply = await callAI({
        provider,
        apiKey,
        model: user.aiModel || undefined,
        system:
          "Você cria perguntas personalizadas para um casal relembrar momentos especiais. " +
          `O casal se chama ${data.names}. ` +
          "Gere 4 perguntas: 2 para cada pessoa. Use os nomes exatos fornecidos. " +
          "Cada pergunta deve ter 4 opções curtas (até 5 palavras). " +
          'Responda APENAS um JSON: [{"for":"me","q":"Pergunta?","options":["A","B","C","D"]},{"for":"partner","q":"Pergunta?","options":["A","B","C","D"]},...]. ' +
          "As perguntas para 'me' devem ser baseadas nas memórias escritas por essa pessoa. " +
          "As perguntas para 'partner' devem ser baseadas nas memórias escritas pelo parceiro. " +
          "Seja carinhoso, pessoal e romântico.",
        messages: [{ role: "user", content: `Memórias de ${myName}:\n${myDigest || "Nenhuma ainda"}\n\nMemórias de ${partnerName}:\n${partnerDigest || "Nenhuma ainda"}` }],
        maxTokens: 700,
        temperature: 0.85,
      });
      const m = reply.match(/\[[\s\S]*\]/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((q: any) => q.q && Array.isArray(q.options) && q.options.length >= 2 && (q.for === "me" || q.for === "partner"))
            .slice(0, 4)
            .map((q: any) => ({ ...q, name: q.for === "me" ? myName : partnerName }));
          if (valid.length > 0) data.questions = valid;
        }
      }
    };

    // Prazo total: a página não espera mais que isto pela IA.
    const deadline = new Promise<void>((res) => setTimeout(res, 3500));
    await Promise.race([
      Promise.allSettled([songTask(), questionsTask()]).then(() => undefined),
      deadline,
    ]);
  }

  if (data.questions.length === 0 && entries.length >= 2 && !allTime) {
    data.questions = FALLBACK_QUESTIONS.map((q) => ({
      ...q,
      name: q.for === "me" ? (me.displayName || me.name) : (me.partner?.displayName || me.partner?.name || "Seu amor"),
    }));
  }

  return (
    <Retrospectiva
      data={data}
      semester={sem}
      otherSemester={otherSem}
      otherSummary={otherSummary}
      savedSongs={savedSongs}
      aiSong={aiSong}
    />
  );
}
