import { prisma } from "@/nucleo/prisma";
import { requireUser, json, handle } from "@/nucleo/api";
import { SESSION_INCLUDE, serializeSession } from "@/nucleo/sessao-jogo";

export const dynamic = "force-dynamic";

/**
 * Sessão "interessante" mais recente do casal: pendente/ativa (pra retomar
 * ou aceitar) ou finalizada há pouco (pra mostrar o resumo do fim de jogo
 * mesmo que o cliente tenha recarregado a página nesse meio-tempo).
 */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ session: null });

    const tenMinAgo = new Date(Date.now() - 10 * 60_000);
    const session = await prisma.gameSession.findFirst({
      where: {
        coupleId: user.coupleId,
        OR: [{ status: { in: ["pending", "active"] } }, { updatedAt: { gte: tenMinAgo } }],
      },
      include: SESSION_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    if (!session) return json({ session: null });
    return json({ session: serializeSession(session, user.id) });
  });
}
