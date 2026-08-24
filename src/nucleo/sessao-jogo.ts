import "server-only";
import { prisma } from "./prisma";
import { bad } from "./api";
import { awardPoints } from "./recompensa";
import { diaBR } from "./pontuacao";
import { GAMES, type GameSlug } from "./jogos";
import { parseJson } from "./jogos/utilitarios";
import type { SessionDTO } from "./jogos/tipos";

export type { SessionDTO } from "./jogos/tipos";

/**
 * Sessões de jogo em dupla — a cola entre o redutor de cada jogo (puro, em
 * `lib/jogos/*`) e o banco.
 *
 * Cada poll grava presença. Ausência nunca apaga a partida: o cliente bloqueia
 * o tabuleiro e mostra "pausado" até o outro usuário voltar. Encerrar por falta
 * de sinal fazia uma oscilação curta de internet destruir uma rodada inteira.
 */
export const STALE_MS = 16_000;

const PLAYER_SELECT = {
  id: true,
  name: true,
  displayName: true,
  avatarColor: true,
  avatarUrl: true,
} as const;

export const SESSION_INCLUDE = {
  host: { select: PLAYER_SELECT },
  guest: { select: PLAYER_SELECT },
} as const;

export type SessionWithPlayers = NonNullable<Awaited<ReturnType<typeof getSessionOr404>>>;

export async function getSessionOr404(id: string, userId: string) {
  const session = await prisma.gameSession.findUnique({ where: { id }, include: SESSION_INCLUDE });
  if (!session) throw bad("Sessão não encontrada.", 404);
  if (session.hostId !== userId && session.guestId !== userId) throw bad("Sem acesso a esta sessão.", 403);
  return session;
}

export function otherUserId(session: { hostId: string; guestId: string }, userId: string) {
  return session.hostId === userId ? session.guestId : session.hostId;
}

/** Sessão pendente ou ativa já existente pro casal — usado pra impedir dois convites simultâneos. */
export async function findOpenSessionForCouple(coupleId: string) {
  return prisma.gameSession.findFirst({
    where: { coupleId, status: { in: ["pending", "active"] } },
    include: SESSION_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Grava a presença de quem chamou. O nome antigo foi preservado para manter as
 * rotas estáveis, mas uma presença vencida agora PAUSA no cliente em vez de
 * encerrar no servidor.
 */
export async function touchPresenceAndCheckStale(
  session: SessionWithPlayers,
  userId: string
): Promise<SessionWithPlayers> {
  const presence = parseJson<Record<string, string>>(session.presence, {});
  presence[userId] = new Date().toISOString();

  return prisma.gameSession.update({
    where: { id: session.id },
    data: { presence: JSON.stringify(presence) },
    include: SESSION_INCLUDE,
  });
}

/** Marca saída da aba imediatamente; o poll do outro lado reflete offline. */
export async function markSessionOffline(session: SessionWithPlayers, userId: string) {
  const presence = parseJson<Record<string, string>>(session.presence, {});
  presence[userId] = new Date(0).toISOString();
  return prisma.gameSession.update({
    where: { id: session.id },
    data: { presence: JSON.stringify(presence) },
    include: SESSION_INCLUDE,
  });
}

/**
 * Combina o placar atual da sessão com os deltas de uma jogada — pura, sem
 * tocar o banco. Usada pela rota de jogada para escrever `state`, `turnUserId`
 * e `scores` num único UPDATE (duas escritas separadas correriam risco de uma
 * pisar na outra quando os dois lados pontuam na mesma jogada).
 */
export function mergeScores(currentScoresJson: string, deltas: Record<string, number> | undefined): string {
  if (!deltas || Object.keys(deltas).length === 0) return currentScoresJson;
  const scores = parseJson<Record<string, number>>(currentScoresJson, {});
  for (const [uid, amount] of Object.entries(deltas)) {
    if (amount > 0) scores[uid] = (scores[uid] ?? 0) + amount;
  }
  return JSON.stringify(scores);
}

/**
 * Registra os pontos ganhos numa jogada nos totais PERMANENTES (GameScore +
 * User.points) — independente por usuário, então é seguro rodar em sequência.
 * O placar DA SESSÃO já foi gravado por `mergeScores` no mesmo UPDATE do state.
 */
export async function recordScoreDeltas(
  coupleId: string,
  game: string,
  deltas: Record<string, number> | undefined
) {
  if (!deltas) return;
  const dia = diaBR();
  for (const [userId, amount] of Object.entries(deltas)) {
    if (amount <= 0) continue;
    await prisma.gameScore.create({ data: { userId, coupleId, game, points: amount, dia } });
    await awardPoints(userId, amount);
  }
}

function displayName(u: { name: string; displayName: string | null }) {
  return u.displayName || u.name;
}

export function serializeSession(session: SessionWithPlayers, meId: string): SessionDTO {
  const isHost = session.hostId === meId;
  const me = isHost ? session.host : session.guest;
  const partner = isHost ? session.guest : session.host;
  const scores = parseJson<Record<string, number>>(session.scores, {});
  const presence = parseJson<Record<string, string>>(session.presence, {});
  const partnerTs = presence[partner.id];
  const partnerOnline = !!partnerTs && Date.now() - new Date(partnerTs).getTime() < STALE_MS;

  const game = session.game as GameSlug;
  const mod = GAMES[game];
  const rawState = parseJson<any>(session.state, {});
  const state = session.status === "pending" ? {} : mod.sanitize(rawState, meId, session.hostId, session.guestId);

  return {
    id: session.id,
    game,
    gameLabel: mod.label,
    status: session.status as SessionDTO["status"],
    meId,
    isHost,
    me: { id: me.id, name: displayName(me), avatarColor: me.avatarColor, avatarUrl: me.avatarUrl },
    partner: { id: partner.id, name: displayName(partner), avatarColor: partner.avatarColor, avatarUrl: partner.avatarUrl },
    turnUserId: session.turnUserId,
    isMyTurn: session.turnUserId === meId,
    myScore: scores[meId] ?? 0,
    partnerScore: scores[partner.id] ?? 0,
    state,
    partnerOnline,
    endedReason: session.endedReason,
    endedById: session.endedById,
    createdAt: session.createdAt.toISOString(),
    acceptedAt: session.acceptedAt?.toISOString() ?? null,
    finishedAt: session.finishedAt?.toISOString() ?? null,
  };
}
