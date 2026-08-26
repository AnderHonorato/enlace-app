import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { getSessionOr404, SESSION_INCLUDE, serializeSession } from "@/nucleo/sessao-jogo";
import { GAMES, type GameSlug } from "@/nucleo/jogos";
import { notifyPartner } from "@/nucleo/notificacoes";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404((await params).id, user.id);

    if (session.status !== "pending") return bad("Esse convite não está mais pendente.", 400);
    if (session.guestId !== user.id) return bad("Só quem foi convidado pode recusar.", 403);

    const updated = await prisma.gameSession.update({
      where: { id: session.id },
      data: { status: "abandoned", endedReason: "declined", endedById: user.id, finishedAt: new Date() },
      include: SESSION_INCLUDE,
    });

    const label = GAMES[session.game as GameSlug].label;
    await notifyPartner(user.id, session.coupleId, {
      kind: "jogo",
      title: "Convite recusado",
      body: `${user.displayName || user.name} não pôde jogar ${label} agora.`,
      url: `/app/jogos`,
      push: false,
    });

    return json({ session: serializeSession(updated, user.id) });
  });
}
