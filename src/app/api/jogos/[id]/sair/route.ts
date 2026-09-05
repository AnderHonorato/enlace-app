import { prisma } from "@/nucleo/prisma";
import { requireUser, json, handle } from "@/nucleo/api";
import { getSessionOr404, SESSION_INCLUDE, serializeSession } from "@/nucleo/sessao-jogo";
import { GAMES, type GameSlug } from "@/nucleo/jogos";
import { notifyPartner } from "@/nucleo/notificacoes";

// Sair encerra a sessão para OS DOIS na hora — não existe "sozinho continua
// jogando". Idempotente: sair de novo (ou de uma sessão já finalizada) só
// devolve o estado atual, sem erro.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404((await params).id, user.id);

    if (session.status === "finished" || session.status === "abandoned") {
      return json({ session: serializeSession(session, user.id) });
    }

    const wasActive = session.status === "active";
    const updated = await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        status: wasActive ? "finished" : "abandoned",
        endedReason: "left",
        endedById: user.id,
        finishedAt: new Date(),
      },
      include: SESSION_INCLUDE,
    });

    if (wasActive) {
      const label = GAMES[session.game as GameSlug].label;
      await notifyPartner(user.id, session.coupleId, {
        kind: "jogo",
        title: "Seu par saiu do jogo",
        body: `${user.displayName || user.name} saiu de ${label}. A partida foi encerrada.`,
        url: `/app/jogos`,
      });
    }

    return json({ session: serializeSession(updated, user.id) });
  });
}
