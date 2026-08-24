import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

// Ping de "digitando…" — grava um timestamp por usuário no casal.
export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Sem casal.", 400);
    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      select: { typing: true },
    });
    let map: Record<string, string> = {};
    try {
      map = JSON.parse(couple?.typing || "{}");
    } catch {}
    map[user.id] = new Date().toISOString();
    await prisma.couple.update({
      where: { id: user.coupleId },
      data: { typing: JSON.stringify(map) },
    });
    return json({ ok: true });
  });
}
