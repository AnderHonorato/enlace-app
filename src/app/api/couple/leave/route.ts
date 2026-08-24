import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você não faz parte de um casal.");
    await prisma.user.update({ where: { id: user.id }, data: { coupleId: null } });
    return json({ ok: true });
  });
}
