import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { GAMES, GAME_SLUGS, isGameSlug } from "@/nucleo/jogos";
import { findOpenSessionForCouple, SESSION_INCLUDE, serializeSession } from "@/nucleo/sessao-jogo";
import { notifyPartner } from "@/nucleo/notificacoes";

const schema = z.object({ game: z.string() });

// Convida o parceiro pra um jogo em dupla. Não recebe "pra quem": o casal é
// sempre a dois, então o convidado é sempre o outro membro do casal.
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você precisa estar num casal para jogar em dupla.", 400);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad("Jogo obrigatório.", 400);
    if (!isGameSlug(parsed.data.game)) {
      return bad(`Jogo desconhecido. Use um de: ${GAME_SLUGS.join(", ")}.`, 400);
    }
    const game = parsed.data.game;

    const partner = await prisma.user.findFirst({
      where: { coupleId: user.coupleId, id: { not: user.id } },
      select: { id: true },
    });
    if (!partner) return bad("Seu parceiro ainda não entrou no casal.", 400);

    const existing = await findOpenSessionForCouple(user.coupleId);
    if (existing) {
      return json({ session: serializeSession(existing, user.id), alreadyOpen: true }, 409);
    }

    const created = await prisma.gameSession.create({
      data: {
        coupleId: user.coupleId,
        game,
        status: "pending",
        hostId: user.id,
        guestId: partner.id,
        presence: JSON.stringify({ [user.id]: new Date().toISOString() }),
      },
      include: SESSION_INCLUDE,
    });

    const label = GAMES[game].label;
    await notifyPartner(user.id, user.coupleId, {
      kind: "jogo",
      title: "Convite para jogar",
      body: `${user.displayName || user.name} te chamou para jogar ${label}.`,
      url: `/app/jogos?sessao=${created.id}`,
      entityType: "gameSession",
      entityId: created.id,
    });

    return json({ session: serializeSession(created, user.id) });
  });
}
