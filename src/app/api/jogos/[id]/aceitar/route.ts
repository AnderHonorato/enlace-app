import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { getSessionOr404, SESSION_INCLUDE, serializeSession } from "@/nucleo/sessao-jogo";
import { GAMES, type GameSlug } from "@/nucleo/jogos";
import { embaralhar } from "@/nucleo/jogos/utilitarios";
import { ICONES_RESERVA } from "@/nucleo/jogos/memoria";
import { notifyPartner } from "@/nucleo/notificacoes";

const PARES_MEMORIA = 6;

/** Até `PARES_MEMORIA` fotos do casal, completadas com ícones se faltar. */
async function facesParaMemoria(coupleId: string): Promise<string[]> {
  const anexos = await prisma.attachment.findMany({
    where: { type: "image", entry: { coupleId } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { url: true },
  });
  const urls = embaralhar(Array.from(new Set(anexos.map((a) => a.url)))).slice(0, PARES_MEMORIA);
  if (urls.length < PARES_MEMORIA) {
    const faltam = PARES_MEMORIA - urls.length;
    urls.push(...embaralhar(ICONES_RESERVA).slice(0, faltam));
  }
  return urls;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404((await params).id, user.id);

    if (session.status !== "pending") return bad("Esse convite não está mais pendente.", 400);
    if (session.guestId !== user.id) return bad("Só quem foi convidado pode aceitar.", 403);

    const game = session.game as GameSlug;
    const mod = GAMES[game];
    const extra = game === "memoria" ? { faces: await facesParaMemoria(session.coupleId) } : undefined;
    const state = mod.createInitialState(session.hostId, session.guestId, extra);
    const turnUserId = mod.initialTurn(session.hostId, session.guestId, state);
    const now = new Date();

    const updated = await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        status: "active",
        state: JSON.stringify(state),
        turnUserId,
        acceptedAt: now,
        presence: JSON.stringify({ [session.hostId]: now.toISOString(), [session.guestId]: now.toISOString() }),
      },
      include: SESSION_INCLUDE,
    });

    await notifyPartner(user.id, session.coupleId, {
      kind: "jogo",
      title: "Convite aceito",
      body: `${user.displayName || user.name} aceitou jogar ${mod.label} com você — vai começar!`,
      url: `/app/jogos?sessao=${session.id}`,
      entityType: "gameSession",
      entityId: session.id,
    });

    return json({ session: serializeSession(updated, user.id) });
  });
}
