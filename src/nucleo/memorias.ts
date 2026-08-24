import { Prisma } from "@prisma/client";

/** Quantidade inicial do feed. Mantém a primeira pintura leve no celular. */
export const FEED_PAGE_SIZE = 12;

export const authorSelect = {
  id: true,
  name: true,
  displayName: true,
  avatarColor: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

/**
 * Identidade da IA quando ela comenta numa memória.
 * O insight que antes aparecia colado no post agora vem como um comentário
 * assinado por este "personagem", dentro da thread.
 */
export const AI_COMMENTER = {
  id: "ai",
  name: "Cupido",
  displayName: "Cupido · IA",
  avatarColor: "#9575E8",
  avatarUrl: null as string | null,
};

export const entryInclude = {
  author: { select: authorSelect },
  attachments: true,
  reactions: { include: { user: { select: authorSelect } } },
  comments: {
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: authorSelect },
      likes: { select: { userId: true, emoji: true } },
    },
  },
} satisfies Prisma.EntryInclude;

export const AI_COMMENT_INCLUDE = {
  author: { select: authorSelect },
  likes: { select: { userId: true, emoji: true } },
} satisfies Prisma.CommentInclude;

type EntryWith = Prisma.EntryGetPayload<{ include: typeof entryInclude }>;

export const REACTION_EMOJIS = ["❤️", "😍", "😂", "🥺", "🔥", "👏", "🎉"];

/**
 * Serializa uma memória. Se ela estiver trancada, o conteúdo NÃO sai daqui —
 * só depois de conferir a senha em /api/entries/[id]/lock (PUT).
 */
export function serializeEntry(e: EntryWith, meId: string, reveal = false) {
  const hearts = e.reactions.filter((r) => r.emoji === "❤️" || r.emoji === "â¤ï¸");
  const hidden = e.locked && !reveal;

  // Agrupa todas as reações por emoji (mantendo a ordem de uso)
  const byEmoji = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of e.reactions) {
    const cur = byEmoji.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    cur.count++;
    if (r.userId === meId) cur.mine = true;
    byEmoji.set(r.emoji, cur);
  }
  return {
    id: e.id,
    title: hidden ? null : e.title,
    content: hidden ? "" : e.content,
    locked: e.locked,
    /** `locked` descreve a proteção persistida; `revealed` vale somente para
     * esta resposta, depois de a senha ter sido conferida. */
    revealed: !hidden,
    mood: hidden ? null : e.mood,
    insight: hidden ? null : e.insight,
    points: e.points,
    favorite: e.favorite,
    place: hidden ? null : e.place,
    lat: hidden ? null : e.lat,
    lng: hidden ? null : e.lng,
    visibility: e.visibility,
    entryDate: e.entryDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    tags: hidden ? [] : safeTags(e.tags),
    author: e.author,
    isMine: e.authorId === meId,
    attachments: hidden
      ? []
      : e.attachments.map((a) => { const decoded = decodeAttachmentCaption(a.caption); return { id: a.id, url: a.url, type: a.type, caption: decoded.caption, transcript: decoded.transcript, duration: a.duration }; }),
    likeCount: hidden ? 0 : hearts.length,
    likedByMe: hidden ? false : hearts.some((r) => r.userId === meId),
    likedBy: hidden ? [] : hearts.map((r) => r.user),
    reactions: hidden ? [] : Array.from(byEmoji.values()),
    comments: hidden ? [] : e.comments.map((c) => serializeComment(c, meId)),
  };
}

export type EntryDTO = ReturnType<typeof serializeEntry>;

type CommentWith = {
  id: string;
  content: string;
  images: string;
  createdAt: Date;
  authorId: string | null;
  aiCharacter: string | null;
  author: { id: string; name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null } | null;
  likes: { userId: string; emoji: string }[];
};

/** Serializa um comentário — resolve o autor humano OU a identidade da IA. */
export function serializeComment(c: CommentWith, meId: string) {
  const isAI = !!c.aiCharacter;
  const author = isAI ? AI_COMMENTER : c.author ?? AI_COMMENTER;
  return {
    id: c.id,
    content: c.content,
    images: safeImages(c.images),
    createdAt: c.createdAt.toISOString(),
    author,
    isAI,
    isMine: !isAI && c.authorId === meId,
    likeCount: c.likes.length,
    likedByMe: c.likes.some((l) => l.userId === meId),
  };
}

export type CommentDTO = ReturnType<typeof serializeComment>;

function safeTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function safeImages(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

/** Filtro do feed: minhas entradas + as compartilhadas do casal. */
export function feedWhere(user: { id: string; coupleId: string | null }): Prisma.EntryWhereInput {
  const or: Prisma.EntryWhereInput[] = [{ authorId: user.id }];
  if (user.coupleId) or.push({ coupleId: user.coupleId, visibility: "shared" });
  return { OR: or };
}

const TRANSCRIPT_PREFIX = "__enlace_transcript_v1__:"; export function decodeAttachmentCaption(raw: string | null) { if (!raw || !raw.startsWith(TRANSCRIPT_PREFIX)) return { caption: raw, transcript: null as string | null }; try { const data = JSON.parse(raw.slice(TRANSCRIPT_PREFIX.length)); return { caption: typeof data.caption === "string" ? data.caption : null, transcript: typeof data.transcript === "string" ? data.transcript : null }; } catch { return { caption: raw, transcript: null as string | null }; } } export function encodeAttachmentCaption(caption: string | null, transcript: string) { return TRANSCRIPT_PREFIX + JSON.stringify({ caption, transcript }); }
