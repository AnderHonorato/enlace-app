import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

// Quantas memórias minhas ainda estão privadas (invisíveis para o parceiro).
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ count: 0 });
    const count = await prisma.entry.count({
      where: { authorId: user.id, visibility: "private" },
    });
    return json({ count });
  });
}

// Compartilha todas as minhas memórias privadas com meu amor.
export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você não faz parte de um casal.");
    const res = await prisma.entry.updateMany({
      where: { authorId: user.id, visibility: "private" },
      data: { coupleId: user.coupleId, visibility: "shared" },
    });
    return json({ shared: res.count });
  });
}
