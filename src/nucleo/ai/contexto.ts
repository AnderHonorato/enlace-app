import "server-only";
import { prisma } from "../prisma";
import { toPlain } from "../sanitizacao";
import { moodOf } from "../humores";
import { levelFromPoints, loveTitle } from "../pontos";
import { feedWhere } from "../memorias";
import { fmtDay } from "../utilitarios";

/**
 * Montagem de contexto compartilhada por análise de memórias, chat e resumo.
 * Existia antes em três lugares (award.ts, chat/route.ts, summary route) —
 * cada um enxergando um pedaço diferente do casal, o que é uma causa direta
 * de respostas rasas e repetitivas: sem saber o que já foi dito, a IA repete
 * o óbvio; sem ver as duas pessoas, ela trata o diário como monólogo.
 *
 * Duas regras não-negociáveis aqui:
 *  1. Memórias com `locked: true` NUNCA entram em nenhuma consulta deste
 *     arquivo — nem para IA nem para exibição. Ver `src/nucleo/entries.ts`.
 *  2. Tudo aqui é fato vindo do banco. Nada é inventado; texto é sempre
 *     recortado (nunca reescrito) antes de virar prompt.
 */

/* ────────────────────────────────────────────────────────────────────────
   Fatos objetivos do casal
   ──────────────────────────────────────────────────────────────────── */

export type CoupleFacts = {
  meName: string;
  partnerName: string | null;
  hasPartner: boolean;
  daysTogether: number | null;
  yearsTogether: number | null;
  howWeMet: string | null;
  level: number;
  loveTitleLabel: string;
  streak: number;
  upcoming: string[];
  todayLabel: string;
};

const WISH_KIND_LABEL: Record<string, string> = {
  date: "Encontro planejado e ainda não feito",
  lugar: "Lugar que querem conhecer",
  sonho: "Sonho do casal",
  outro: "Plano em aberto",
};

/**
 * Fatos verificáveis sobre o casal — nomes, tempo juntos, nível, sequência
 * e o que está "em aberto" (desejos não realizados, cápsulas ainda lacradas).
 * `user` deve vir de `getCurrentUser()`/`requireUser()`, que já inclui
 * `couple.members`.
 */
export async function getCoupleFacts(user: any): Promise<CoupleFacts> {
  const meName = user.displayName || user.name;
  const todayLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const level = levelFromPoints(user.points ?? 0);
  const loveTitleLabel = loveTitle(level).title;
  const streak = user.streak ?? 0;

  const couple = user.couple;
  if (!user.coupleId || !couple) {
    return {
      meName,
      partnerName: null,
      hasPartner: false,
      daysTogether: null,
      yearsTogether: null,
      howWeMet: null,
      level,
      loveTitleLabel,
      streak,
      upcoming: [],
      todayLabel,
    };
  }

  const partner = (couple.members || []).find((m: any) => m.id !== user.id) ?? null;
  const partnerName = partner ? partner.displayName || partner.name : null;

  let daysTogether: number | null = null;
  let yearsTogether: number | null = null;
  if (couple.anniversary) {
    const days = Math.floor((Date.now() - new Date(couple.anniversary).getTime()) / 86400000);
    if (days >= 0) {
      daysTogether = days;
      yearsTogether = Math.floor(days / 365);
    }
  }

  const upcoming: string[] = [];
  try {
    const [wishes, capsules] = await Promise.all([
      prisma.wish.findMany({
        where: { coupleId: user.coupleId, done: false },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { title: true, kind: true },
      }),
      prisma.capsule.findMany({
        where: { coupleId: user.coupleId, status: "SEALED", openAt: { gt: new Date() } },
        orderBy: { openAt: "asc" },
        take: 2,
        select: { openAt: true },
      }),
    ]);
    for (const w of wishes) {
      upcoming.push(`${WISH_KIND_LABEL[w.kind] || "Plano em aberto"}: "${w.title.slice(0, 70)}"`);
    }
    for (const c of capsules) {
      upcoming.push(`Cápsula do tempo lacrada, abre em ${fmtDay(c.openAt)} — conteúdo é segredo até lá`);
    }
  } catch {
    // Sem desejos/cápsulas cadastrados não deve derrubar o contexto.
  }

  return {
    meName,
    partnerName,
    hasPartner: !!partner,
    daysTogether,
    yearsTogether,
    howWeMet: couple.howWeMet ? String(couple.howWeMet).slice(0, 300) : null,
    level,
    loveTitleLabel,
    streak,
    upcoming,
    todayLabel,
  };
}

/** Formata os fatos do casal como bloco de sistema em português. */
export function formatCoupleFactsBlock(f: CoupleFacts): string {
  const lines = ["# Fatos sobre o casal (verdadeiros — use com naturalidade, nunca recite de volta)"];
  lines.push(`Hoje é ${f.todayLabel}.`);
  lines.push(`Quem está falando com você agora: ${f.meName}.`);
  if (f.hasPartner) {
    lines.push(`O parceiro ou parceira se chama ${f.partnerName}.`);
  } else {
    lines.push("Ainda não há parceiro(a) conectado(a) ao diário — não presuma que existe.");
  }
  if (f.daysTogether != null) {
    const anos = f.yearsTogether && f.yearsTogether >= 1 ? ` (cerca de ${f.yearsTogether} ${f.yearsTogether === 1 ? "ano" : "anos"})` : "";
    lines.push(`Estão juntos há ${f.daysTogether.toLocaleString("pt-BR")} dias${anos}.`);
  }
  if (f.howWeMet) lines.push(`Como se conheceram, nas palavras deles: "${f.howWeMet}"`);
  lines.push(
    `Nível do casal: ${f.level} (título "${f.loveTitleLabel}"). Sequência atual de ${f.meName}: ${f.streak} ${f.streak === 1 ? "dia" : "dias"} seguidos.`
  );
  if (f.upcoming.length) {
    lines.push("Coisas em aberto que eles mesmos já registraram no app:");
    for (const u of f.upcoming) lines.push(`- ${u}`);
  }
  return lines.join("\n");
}

/* ────────────────────────────────────────────────────────────────────────
   Linha do tempo recente (memórias do diário)
   ──────────────────────────────────────────────────────────────────── */

export type TimelineDigest = {
  lines: string[];
  moodTrend: string | null;
  topTags: string[];
  count: number;
};

function safeTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Últimas memórias do casal — as DUAS pessoas, porque o diário é um recado
 * de um para o outro, não o histórico de uma pessoa só. Nunca inclui
 * memórias trancadas (`locked: true`): a regra de privacidade vem antes de
 * qualquer ganho de contexto.
 *
 * As mais recentes ganham mais texto; o resto vira uma linha curta — é o
 * jeito barato de ter uma janela grande sem estourar tokens.
 */
export async function getTimelineDigest(
  user: { id: string; coupleId: string | null },
  opts: { take?: number; excludeEntryId?: string } = {}
): Promise<TimelineDigest> {
  const take = opts.take ?? 10;
  const and: any[] = [feedWhere(user), { locked: false }];
  if (opts.excludeEntryId) and.push({ id: { not: opts.excludeEntryId } });

  const entries = await prisma.entry.findMany({
    where: { AND: and },
    include: { author: { select: { name: true, displayName: true } } },
    orderBy: { entryDate: "desc" },
    take,
  });

  if (!entries.length) return { lines: [], moodTrend: null, topTags: [], count: 0 };

  const lines = entries.map((e, i) => {
    const quem = e.author.displayName || e.author.name;
    const mood = moodOf(e.mood)?.label;
    const text = toPlain(e.content) || e.title || "(sem texto)";
    // As 4 mais recentes ganham mais espaço; o resto é resumo curto.
    const cap = i < 4 ? 170 : 70;
    return `- [${fmtDay(e.entryDate)}] ${quem}${mood ? ` (${mood})` : ""}: ${text.slice(0, cap)}`;
  });

  const moodCounts = new Map<string, number>();
  for (const e of entries) {
    if (!e.mood) continue;
    moodCounts.set(e.mood, (moodCounts.get(e.mood) || 0) + 1);
  }
  let moodTrend: string | null = null;
  if (moodCounts.size) {
    const top = [...moodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => moodOf(k)?.label)
      .filter(Boolean) as string[];
    if (top.length) moodTrend = top.join(" e ");
  }

  const tagCounts = new Map<string, number>();
  for (const e of entries) for (const t of safeTags(e.tags)) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  return { lines, moodTrend, topTags, count: entries.length };
}

export function formatTimelineBlock(t: TimelineDigest): string {
  if (!t.count) return "# Linha do tempo\nAinda não há memórias registradas no diário.";
  const lines = [`# Linha do tempo recente do casal (${t.count} memórias, mais recente primeiro)`, ...t.lines];
  if (t.moodTrend) lines.push(`Humor predominante no período: ${t.moodTrend}.`);
  if (t.topTags.length) lines.push(`Temas/tags que aparecem: ${t.topTags.join(", ")}.`);
  return lines.join("\n");
}

/* ────────────────────────────────────────────────────────────────────────
   Não se repetir
   ──────────────────────────────────────────────────────────────────── */

/**
 * Bloco de "não repita isso". `previous` são coisas que a própria IA já
 * disse (insights de memórias anteriores, ou mensagens antigas do
 * personagem). A instrução é explícita de propósito: passar o histórico cru
 * não é o bastante — o modelo precisa de uma lista curta e escaneável do
 * que evitar, ou tende a reciclar a mesma abertura confortável.
 */
export function formatAvoidRepeatBlock(previous: string[], label: string): string {
  const items = previous.filter(Boolean).slice(0, 10);
  if (!items.length) return "";
  return [
    "# Não se repita",
    `${label}:`,
    ...items.map((s) => `- "${s.replace(/\s+/g, " ").trim().slice(0, 100)}"`),
    "Não reaproveite essas aberturas, ângulos ou frases-feitas. Repare em outro detalhe ou mude a estrutura da frase.",
  ].join("\n");
}

/** Últimos insights de IA em memórias do casal (nunca de entradas trancadas). */
export async function getRecentInsights(
  user: { id: string; coupleId: string | null },
  take = 6
): Promise<string[]> {
  const entries = await prisma.entry.findMany({
    where: { AND: [feedWhere(user), { locked: false }, { insight: { not: null } }] },
    select: { insight: true },
    orderBy: { entryDate: "desc" },
    take,
  });
  return entries.map((e) => e.insight).filter((s): s is string => !!s);
}

/** Extrai as últimas falas do personagem (já carregadas em memória — sem consulta extra). */
export function extractRecentAssistantLines(
  history: { role: string; content: string }[],
  take = 8
): string[] {
  return history
    .filter((m) => m.role === "assistant")
    .slice(-take)
    .map((m) => m.content);
}

/**
 * Comprime mensagens antigas do chat (fora da janela verbatim) em linhas
 * curtas, para a conversa "lembrar" de mais coisas sem custar tokens como se
 * fossem enviadas por inteiro.
 */
export function formatOlderMessagesBlock(
  older: { role: string; content: string }[],
  take = 16
): string {
  if (!older.length) return "";
  const slice = older.slice(-take);
  const lines = slice.map(
    (m) => `${m.role === "user" ? "Pessoa" : "Você"}: ${m.content.replace(/\s+/g, " ").trim().slice(0, 120)}`
  );
  return ["# Início desta conversa (resumo comprimido, mais antigo primeiro)", ...lines].join("\n");
}
