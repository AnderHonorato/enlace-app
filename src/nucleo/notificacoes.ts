import "server-only";
import { prisma } from "./prisma";
import { sendToUser, type PushPayload } from "./notificacao-push";

/** Tipos de evento que geram notificação. */
export type NotifyKind =
  | "entry"
  | "reaction"
  | "comment"
  | "comment_like"
  | "capsule"
  | "capsule_open"
  | "task"
  | "task_comment"
  | "task_done"
  | "goal"
  | "wish"
  | "summary"
  | "couple"
  | "chat"
  | "secret"
  | "ai_comment"
  | "streak"
  | "jogo";

export type NotifyInput = {
  /** Quem recebe. */
  userId: string;
  /** Quem causou (omita para eventos do sistema/IA). */
  actorId?: string | null;
  kind: NotifyKind;
  title: string;
  body?: string;
  /** Destino ao tocar — deve levar à origem do evento. */
  url?: string;
  entityType?: string | null;
  entityId?: string | null;
  emoji?: string | null;
  /** Também dispara push (padrão: sim). */
  push?: boolean;
};

/** Ícone padrão por tipo de evento. */
const KIND_EMOJI: Record<NotifyKind, string> = {
  entry: "📖",
  reaction: "❤️",
  comment: "💬",
  comment_like: "💗",
  capsule: "💌",
  capsule_open: "🎁",
  task: "📝",
  task_comment: "💬",
  task_done: "✅",
  goal: "🎯",
  wish: "⭐",
  summary: "✦",
  couple: "💞",
  chat: "✉️",
  secret: "🔒",
  ai_comment: "✨",
  streak: "🔥",
  jogo: "🎮",
};

/**
 * Cria a notificação in-app e (por padrão) envia o push.
 * Nunca lança: uma falha de notificação não pode derrubar a ação principal.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const {
    userId,
    actorId = null,
    kind,
    title,
    body = "",
    url = "/app",
    entityType = null,
    entityId = null,
    emoji = KIND_EMOJI[kind] ?? null,
    push = true,
  } = input;

  // Não notifica você sobre suas próprias ações.
  if (actorId && actorId === userId) return;

  try {
    await prisma.notification.create({
      data: { userId, actorId, kind, title, body: body.slice(0, 300), url, entityType, entityId, emoji },
    });
  } catch (err) {
    console.error("notify: falha ao salvar", err);
  }

  if (push) {
    const payload: PushPayload = { title, body: body.slice(0, 160) || "Toque para ver", url, tag: kind };
    sendToUser(userId, payload).catch(() => {});
  }
}

/**
 * Notifica o parceiro do casal (se houver). Retorna o id do parceiro, ou null.
 */
export async function notifyPartner(
  actorId: string,
  coupleId: string | null,
  input: Omit<NotifyInput, "userId" | "actorId">
): Promise<string | null> {
  if (!coupleId) return null;
  const partner = await prisma.user
    .findFirst({ where: { coupleId, id: { not: actorId } }, select: { id: true } })
    .catch(() => null);
  if (!partner) return null;
  await notify({ ...input, userId: partner.id, actorId });
  return partner.id;
}

/** Link para uma memória no feed (a Timeline destaca e rola até ela). */
export function entryUrl(entryId: string): string {
  return `/app?memoria=${entryId}`;
}

/** Link para um comentário — abre a memória com os comentários expandidos. */
export function commentUrl(entryId: string, commentId: string): string {
  return `/app?memoria=${entryId}&comentario=${commentId}`;
}

export type NotificationDTO = {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  emoji: string | null;
  read: boolean;
  createdAt: string;
  actor: { name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null } | null;
};

export function serializeNotification(n: any): NotificationDTO {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    url: n.url,
    emoji: n.emoji,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor
      ? {
          name: n.actor.name,
          displayName: n.actor.displayName,
          avatarColor: n.actor.avatarColor,
          avatarUrl: n.actor.avatarUrl,
        }
      : null,
  };
}
