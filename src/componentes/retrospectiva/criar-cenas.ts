import type { CenaRetrospectiva, DadosRetrospectiva } from "./tipos";

export const DURACAO_CENA = 5200;
/** Slides com mais para olhar ou tocar ganham tempo extra. */
const DURACAO_CENA_LONGA = 8200;

export function capituloDaCena(slide: CenaRetrospectiva): string {
  if (["intro", "met-date", "starmap-met", "moon-met", "anniversary", "counter", "first-entry"].includes(slide.key)) return "Nossa origem";
  if (["total", "app-pulse", "chat", "plans", "games", "words", "month", "authors"].includes(slide.key)) return "O app de vocês";
  if (["timeline", "collage", "mural", "polaroid", "filmstrip", "places"].includes(slide.key)) return "Momentos";
  if (["mood", "love", "tags", "late", "streak", "top", "level"].includes(slide.key) || slide.key.startsWith("achievements")) return "Jeito de amar";
  if (["questions", "wordle", "roleta"].includes(slide.key)) return "Para brincar";
  return "Até a próxima";
}

export function criarCenas(d: DadosRetrospectiva, semester?: number, otherSemester?: number, otherSummary?: { total: number; topMoodLabel?: string; topMoodEmoji?: string } | null, nowMs = 0): CenaRetrospectiva[] {
  const periodo = d.allTime ? "de vocês" : `de ${d.year}`;
  const semLabel = semester ? `${semester}º semestre` : "";
  const photos = d.photos ?? [];
  const s: CenaRetrospectiva[] = [];

  s.push({
    key: "intro",
    grad: ["#E5679B", "#9575E8"],
    eyebrow: d.allTime ? "A retrospectiva" : `Retrospectiva ${d.year}`,
    title: d.names,
    sub: d.allTime ? "Vamos relembrar a história de vocês?" : `${semLabel} — vamos relembrar?`,
    emoji: "💞",
    ambience: "hearts",
  });

  // ── Datas especiais ──
  if (d.metDate) {
    const dt = new Date(d.metDate);
    const fmt = dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    const dias = Math.floor((nowMs - dt.getTime()) / 86400000);
    s.push({
      key: "met-date",
      grad: ["#F0883E", "#E5679B"],
      eyebrow: "O dia em que se conheceram",
      big: fmt.split(" de ")[0],
      title: fmt.split(" de ").slice(1).join(" de "),
      sub: dias > 0 ? `Faz ${dias.toLocaleString("pt-BR")} dias. O universo conspirou.` : "E o universo conspirou.",
      emoji: "✨",
      ambience: "stars",
    });

    // O céu daquela noite — o momento mais "uau" da retrospectiva.
    s.push({
      key: "starmap-met",
      grad: ["#221c39", "#3b2a63"],
      eyebrow: "O céu naquele dia",
      title: "Era esse o céu",
      layout: "starmap",
      date: d.metDate,
      ambience: "stars",
      ms: DURACAO_CENA_LONGA,
    });

    s.push({
      key: "moon-met",
      grad: ["#1a1430", "#33265c"],
      eyebrow: "E a lua estava assim",
      title: "A lua daquele dia",
      layout: "moon",
      date: d.metDate,
      ambience: "stars",
    });
  }

  if (d.anniversary) {
    const dt = new Date(d.anniversary);
    const fmt = dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    const dias = Math.floor((nowMs - dt.getTime()) / 86400000);
    s.push({
      key: "anniversary",
      grad: ["#E5679B", "#F4726A"],
      eyebrow: "Começaram a namorar",
      big: fmt.split(" de ")[0],
      title: fmt.split(" de ").slice(1).join(" de "),
      sub: dias > 0 ? `São ${dias.toLocaleString("pt-BR")} dias de amor.` : "O início de tudo.",
      emoji: "💘",
      ambience: "hearts",
    });

    // Contador ao vivo desde o início do namoro.
    s.push({
      key: "counter",
      grad: ["#9575E8", "#E5679B"],
      eyebrow: "Vocês estão juntos há",
      title: "",
      layout: "counter",
      date: d.anniversary,
      ambience: "bokeh",
      ms: DURACAO_CENA_LONGA,
    });
  } else if (d.metDate) {
    s.push({
      key: "counter",
      grad: ["#9575E8", "#E5679B"],
      eyebrow: "Desde que se conheceram, já são",
      title: "",
      layout: "counter",
      date: d.metDate,
      ambience: "bokeh",
      ms: DURACAO_CENA_LONGA,
    });
  }

  // ── A primeira memória ──
  if (d.firstEntry) {
    const dt = new Date(d.firstEntry.date);
    s.push({
      key: "first-entry",
      grad: ["#4ABEB0", "#5AA0F0"],
      eyebrow: "Onde tudo começou aqui",
      title: d.firstEntry.title,
      sub: `${d.allTime ? "A primeira memória do diário" : "A primeira memória deste período"} — por ${d.firstEntry.author}, em ${dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}.`,
      layout: d.firstEntry.photo ? "polaroid" : "text",
      photo: d.firstEntry.photo,
      ambience: "bokeh",
    });
  }

  s.push({
    key: "total",
    grad: ["#9575E8", "#5AA0F0"],
    eyebrow: `A história ${periodo}`,
    big: String(d.total),
    title: d.total === 1 ? "memória guardada" : "memórias guardadas",
    sub: d.total > 0 ? "Cada uma delas é um pedacinho de vocês." : "Que tal começar hoje?",
  });

  // ── Retrospectiva do aplicativo, não apenas do diário ──
  const app = d.appStats;
  if (app) {
    const featuresUsed = [
      d.total > 0,
      app.chatMessages > 0,
      app.gamesPlayed > 0,
      app.tasksCreated > 0,
      app.wishesCreated > 0,
      app.goalsCreated > 0,
      app.capsules > 0,
      app.surprises > 0,
    ].filter(Boolean).length;
    if (featuresUsed > 1) {
      s.push({
        key: "app-pulse",
        grad: ["#202633", "#6f3653"],
        eyebrow: "Muito além do diário",
        title: "O Enlace de vocês",
        sub: `${featuresUsed} cantinhos do app fizeram parte dessa história.`,
        layout: "app-pulse",
        ambience: "bokeh",
        ms: DURACAO_CENA_LONGA,
      });
    }
    if (app.chatMessages > 0) {
      const mediaTotal = app.chatMedia.images + app.chatMedia.audios + app.chatMedia.videos + app.chatMedia.files;
      s.push({
        key: "chat",
        grad: ["#5b3b8c", "#a32e4c"],
        eyebrow: "Na conversa de vocês",
        big: app.chatMessages.toLocaleString("pt-BR"),
        title: app.chatMessages === 1 ? "mensagem trocada" : "mensagens trocadas",
        sub: mediaTotal > 0
          ? `${mediaTotal} ${mediaTotal === 1 ? "lembrança enviada" : "lembranças enviadas"} entre fotos, áudios e vídeos.`
          : "Um tanto de assunto que só vocês entendem.",
        emoji: "💬",
        ambience: "hearts",
      });
    }
    if (app.tasksCreated + app.wishesCreated + app.goalsCreated > 0) {
      s.push({
        key: "plans",
        grad: ["#202633", "#3b5f67"],
        eyebrow: "Planos criados neste período",
        title: "O que vocês estão construindo",
        layout: "plans",
        ambience: "stars",
        ms: DURACAO_CENA_LONGA,
      });
    }
    if (app.gamesPlayed > 0 || app.gamePoints > 0) {
      s.push({
        key: "games",
        grad: ["#202633", "#6b4b32"],
        eyebrow: `${app.gamesPlayed} ${app.gamesPlayed === 1 ? "jogo registrado" : "jogos registrados"}`,
        title: "Também teve competição",
        layout: "games",
        ambience: "confetti",
        ms: DURACAO_CENA_LONGA,
      });
    }
  }

  // ── Nossa jornada: linha do tempo dos marcos ──
  if (d.timeline && d.timeline.length >= 3) {
    s.push({
      key: "timeline",
      grad: ["#221c39", "#5b3b8c"],
      eyebrow: "Nossa jornada",
      title: "Como foi, passo a passo",
      layout: "timeline",
      ambience: "stars",
      ms: DURACAO_CENA_LONGA,
    });
  }

  // Colagem com as fotos da linha do tempo
  if (photos.length >= 3) {
    s.push({
      key: "collage",
      grad: ["#F0883E", "#E5679B"],
      eyebrow: "Momentos de vocês",
      title: "Olha só essas lembranças",
      layout: "collage",
      ambience: "bokeh",
      photos: photos.slice(0, 7),
    });
  }

  // ── Mural de fotos animado ──
  const allPics = d.allPhotos.length > 0 ? d.allPhotos : photos;
  if (allPics.length >= 2) {
    s.push({
      key: "mural",
      grad: ["#4ABEB0", "#9575E8"],
      eyebrow: `${allPics.length} momentos`,
      title: "O mural de vocês",
      layout: "mural",
      photos: allPics.slice(0, 20),
      sub: "Cada foto conta uma história.",
    });
  }

  // ── Cápsulas do tempo ──
  if (d.capsules && d.capsules.length > 0) {
    s.push({
      key: "capsules",
      grad: ["#9575E8", "#F0883E"],
      eyebrow: "Cápsulas do tempo",
      big: String(d.capsules.length),
      title: d.capsules.length === 1 ? "cápsula criada" : "cápsulas criadas",
      sub: d.capsules.map((c) => c.title || "Cápsula sem título").join(" · "),
      emoji: "💌",
    });
  }

  if (d.words > 0) {
    const paginas = Math.max(1, Math.round(d.words / 250));
    s.push({
      key: "words",
      grad: ["#F0883E", "#E5679B"],
      eyebrow: "Vocês escreveram",
      big: d.words.toLocaleString("pt-BR"),
      title: "palavras de amor",
      sub: `Daria um livrinho de ${paginas} ${paginas === 1 ? "página" : "páginas"} 📖`,
    });
  }

  if (d.topMood) {
    s.push({
      key: "mood",
      grad: ["#6366C9", "#8B5CD6"],
      eyebrow: "O sentimento que mais apareceu",
      emoji: d.topMood.emoji,
      title: d.topMood.label,
      sub: `${d.topMood.count} ${d.topMood.count === 1 ? "vez" : "vezes"} — foi o clima de vocês.`,
    });
  }

  // Polaroide de uma memória com foto
  const polaroid = photos[Math.floor(photos.length / 2)];
  if (polaroid) {
    s.push({
      key: "polaroid",
      grad: ["#4ABEB0", "#5AA0F0"],
      eyebrow: "Um instante que ficou",
      title: polaroid.title || "Esse momento",
      sub: `por ${polaroid.author}`,
      layout: "polaroid",
      photo: polaroid.url,
    });
  }

  if (d.busiestMonth && d.busiestMonth.count > 0) {
    s.push({
      key: "month",
      grad: ["#4ABEB0", "#5AA0F0"],
      eyebrow: "O mês mais intenso",
      title: d.busiestMonth.name,
      big: String(d.busiestMonth.count),
      sub: `${d.busiestMonth.count === 1 ? "memória" : "memórias"} só nesse mês!`,
    });
  }

  if (d.authors.length >= 2) {
    const [first, second] = d.authors;
    s.push({
      key: "authors",
      grad: ["#E5679B", "#F0883E"],
      eyebrow: "Quem escreveu mais",
      title: first.name,
      big: String(first.count),
      sub: `${second.name} escreveu ${second.count}. Empate no amor, né? 💕`,
    });
  }

  // Tira de filme com mais fotos
  if (photos.length >= 4) {
    s.push({
      key: "filmstrip",
      grad: ["#9575E8", "#E5679B"],
      eyebrow: `${d.photosCount ?? photos.length} fotos guardadas`,
      title: "O filme de vocês",
      layout: "filmstrip",
      photos: photos.slice(0, 12),
      sub: d.places > 0 ? `Em ${d.places} ${d.places === 1 ? "lugar especial" : "lugares especiais"} 📍` : undefined,
    });
  }

  // ── Mapa da jornada: os lugares de vocês ──
  if (d.placeList && d.placeList.length >= 2) {
    s.push({
      key: "places",
      grad: ["#1d2f47", "#3E6FA8"],
      eyebrow: `${d.placeList.length} ${d.placeList.length === 1 ? "lugar" : "lugares"} no mapa`,
      title: "Por onde vocês passaram",
      layout: "places",
      ambience: "stars",
      ms: DURACAO_CENA_LONGA,
    });
  }

  if (d.likes > 0 || d.comments > 0) {
    s.push({
      key: "love",
      grad: ["#F4726A", "#E5679B"],
      eyebrow: "Carinho trocado",
      big: String(d.likes + d.comments),
      title: "gestos de amor",
      sub: `${d.likes} ${d.likes === 1 ? "coração" : "corações"} e ${d.comments} ${d.comments === 1 ? "comentário" : "comentários"}`,
    });
  }

  if (d.topTags.length > 0) {
    s.push({
      key: "tags",
      grad: ["#5AA0F0", "#9575E8"],
      eyebrow: "O que marcou",
      title: "Os assuntos de vocês",
      chips: d.topTags,
      ambience: "bokeh",
    });
  }

  // ── Curiosidades: madrugada e constância ──
  if ((d.lateNights ?? 0) >= 3) {
    s.push({
      key: "late",
      grad: ["#1a1430", "#4a2f6d"],
      eyebrow: "Depois da meia-noite",
      big: String(d.lateNights),
      title: (d.lateNights ?? 0) === 1 ? "memória de madrugada" : "memórias de madrugada",
      sub: "As coisas mais sinceras costumam ser escritas de madrugada.",
      emoji: "🌙",
      ambience: "stars",
    });
  }

  if ((d.bestStreak ?? 0) >= 5) {
    s.push({
      key: "streak",
      grad: ["#F0883E", "#F4726A"],
      eyebrow: "A maior sequência",
      big: String(d.bestStreak),
      title: "dias seguidos escrevendo",
      sub: "Constância é o segredo mais chato e mais eficiente que existe.",
      emoji: "🔥",
      ambience: "bokeh",
    });
  }

  if (d.topEntry) {
    s.push({
      key: "top",
      grad: ["#E0A84A", "#E5679B"],
      eyebrow: "A memória mais amada",
      title: d.topEntry.title,
      sub: `“${d.topEntry.excerpt}${d.topEntry.excerpt.length >= 180 ? "…" : ""}” — ${d.topEntry.author}`,
      layout: d.topEntry.photo ? "polaroid" : "text",
      photo: d.topEntry.photo,
    });
  }

  // ── Conquistas atuais ──
  if (d.achievements && d.achievements.length > 0) {
    // Em blocos de 3 para caber na tela sem apertar.
    const blocos = Math.min(3, Math.ceil(d.achievements.length / 3));
    for (let b = 0; b < blocos; b++) {
      s.push({
        key: `achievements-${b}`,
        grad: b === 0 ? ["#E0A84A", "#E5679B"] : b === 1 ? ["#9575E8", "#5AA0F0"] : ["#4ABEB0", "#9575E8"],
        eyebrow:
          b === 0
            ? `${d.achievements.length} ${d.achievements.length === 1 ? "conquista atual" : "conquistas atuais"}`
            : "E também",
        title: b === 0 ? "Conquistas de vocês" : "Mais conquistas",
        layout: "achievements",
        ambience: b === 0 ? "confetti" : "bokeh",
        ms: DURACAO_CENA_LONGA,
      });
    }
  }

  s.push({
    key: "level",
    grad: ["#9575E8", "#F4726A"],
    eyebrow: "O nível de vocês",
    emoji: d.loveTitle.emoji,
    title: d.loveTitle.title,
    big: `Nv ${d.level}`,
    sub: `${d.points.toLocaleString("pt-BR")} pontos de conexão${
      d.daysTogether ? ` · ${d.daysTogether.toLocaleString("pt-BR")} dias juntos` : ""
    }`,
    ambience: "confetti",
  });

  // ── Brincadeiras do casal ──
  if (d.wordleWord) {
    s.push({
      key: "wordle",
      grad: ["#4ABEB0", "#5AA0F0"],
      eyebrow: "A palavra de vocês",
      title: "Adivinha qual é?",
      sub: "Aquela palavra que só vocês dois entendem.",
      layout: "wordle",
      ambience: "bokeh",
      ms: DURACAO_CENA_LONGA,
    });
  }

  if (d.roletaOptions && d.roletaOptions.length >= 2) {
    s.push({
      key: "roleta",
      grad: ["#E5679B", "#E0A84A"],
      eyebrow: "A roleta de vocês",
      title: "O que o destino escolheu",
      layout: "roleta",
      ambience: "confetti",
      ms: DURACAO_CENA_LONGA,
    });
  }

  // Perguntas fecham o arco em clima de brincadeira, depois dos números.
  if (d.questions.length > 0) {
    s.push({
      key: "questions",
      grad: ["#6366C9", "#9575E8"],
      eyebrow: "Perguntas para vocês",
      title: "Respondam juntos",
      sub: "Toque na sua resposta. Cada um responde a sua parte.",
      emoji: "💬",
      layout: "text",
      question: d.questions[0] as any,
    } as CenaRetrospectiva);
  }

  // ── Resumo do outro semestre ──
  if (!d.allTime && otherSummary && otherSummary.total > 0 && otherSemester) {
    const label = `${otherSemester}º semestre de ${d.year}`;
    s.push({
      key: "other-semester",
      grad: ["#5AA0F0", "#4ABEB0"],
      eyebrow: `E no ${label}?`,
      big: String(otherSummary.total),
      title: otherSummary.total === 1 ? "memória guardada" : "memórias guardadas",
      sub: otherSummary.topMoodEmoji && otherSummary.topMoodLabel
        ? `${otherSummary.topMoodEmoji} O clima foi ${otherSummary.topMoodLabel}. Veja completo!`
        : "Veja a retrospectiva completa!",
      emoji: "📅",
    });
  }

  s.push({
    key: "end",
    grad: ["#E5679B", "#9575E8"],
    eyebrow: d.allTime ? "E a história continua…" : `${d.year} foi de vocês`,
    emoji: "💜",
    title: "Que venham muitas outras",
    sub: "Obrigado por guardar tudo isso no Enlace.",
    ambience: "hearts",
  });

  // Em contas muito ativas o catálogo condicional podia passar de 30 telas.
  // A experiência móvel fica especial quando termina antes de cansar: escolhe
  // no máximo 20 cenas, mantendo o arco emocional e os módulos usados.
  const MAX_SLIDES = 20;
  if (s.length <= MAX_SLIDES) return s;
  const keep = new Set<string>(["intro", "end"]);
  const reserve = (keys: string[], amount: number) => {
    let added = 0;
    for (const key of keys) {
      if (added >= amount || keep.size >= MAX_SLIDES) break;
      if (s.some((slide) => slide.key === key) && !keep.has(key)) {
        keep.add(key);
        added++;
      }
    }
  };

  // Cotas por capítulo impedem que contas completas percam justamente o
  // final emocional, as conquistas ou uma brincadeira interativa.
  reserve(["total"], 1);
  reserve(["level"], 1);
  reserve(["achievements-0"], 1);
  reserve(["questions"], 1);
  reserve(["met-date", "starmap-met", "moon-met", "anniversary", "counter", "first-entry"], 3);
  reserve(["app-pulse", "chat", "plans", "games"], 3);
  reserve(["timeline", "collage", "mural", "filmstrip", "places"], 3);
  reserve(["mood", "love", "top"], 2);
  reserve(["wordle", "roleta"], 1);
  reserve(["other-semester"], 1);
  for (const slide of s) {
    if (keep.size >= MAX_SLIDES) break;
    keep.add(slide.key);
  }
  return s.filter((slide) => keep.has(slide.key));
}
