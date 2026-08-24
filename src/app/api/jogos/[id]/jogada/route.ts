import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import {
  getSessionOr404,
  touchPresenceAndCheckStale,
  mergeScores,
  recordScoreDeltas,
  SESSION_INCLUDE,
  serializeSession,
} from "@/nucleo/sessao-jogo";
import { GAMES, MoveError, type GameSlug } from "@/nucleo/jogos";
import { parseJson } from "@/nucleo/jogos/utilitarios";

// O coração do multiplayer: recebe UMA jogada, aplica o redutor puro do jogo
// (lib/jogos/*), e grava estado + turno + placar num único UPDATE. O servidor
// é a única fonte de verdade — o cliente nunca escreve estado diretamente.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404(params.id, user.id);

    if (session.status !== "active") {
      return bad("Essa sessão não está ativa.", 400);
    }

    // Grava presença e checa se o parceiro sumiu ANTES de aplicar a jogada —
    // se ele sumiu, a partida acabou de terminar por timeout e não há mais
    // jogada a aceitar.
    const fresh = await touchPresenceAndCheckStale(session, user.id);
    if (fresh.status !== "active") {
      return json({ session: serializeSession(fresh, user.id) });
    }

    const body = await req.json().catch(() => ({}));
    const move = body?.move;
    if (!move || typeof move !== "object" || typeof move.type !== "string") {
      return bad("Jogada inválida.", 400);
    }

    const game = fresh.game as GameSlug;
    const mod = GAMES[game];
    const currentState = parseJson<any>(fresh.state, {});

    let result;
    try {
      result = mod.applyMove({ state: currentState, userId: user.id, hostId: fresh.hostId, guestId: fresh.guestId, move });
    } catch (e) {
      if (e instanceof MoveError) return bad(e.message, 400);
      throw e;
    }

    const nextTurnUserId = "turnUserId" in result ? result.turnUserId ?? null : fresh.turnUserId;
    const nextScoresJson = mergeScores(fresh.scores, result.scoreDelta);

    const updated = await prisma.gameSession.update({
      where: { id: fresh.id },
      data: {
        state: JSON.stringify(result.state),
        turnUserId: nextTurnUserId,
        scores: nextScoresJson,
      },
      include: SESSION_INCLUDE,
    });

    await recordScoreDeltas(fresh.coupleId, game, result.scoreDelta);

    return json({ session: serializeSession(updated, user.id) });
  });
}
