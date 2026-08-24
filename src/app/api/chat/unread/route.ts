export const dynamic = "force-dynamic";
import { prisma } from "@/nucleo/prisma";
import { requireIdentity, json, handle } from "@/nucleo/api";

// Contador de mensagens não lidas (badge da navegação).
export async function GET() {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return json({ count: 0 });
    const count = await prisma.message.count({
      where: { coupleId: user.coupleId, senderId: { not: user.id }, readAt: null },
    });
    return json({ count });
  });
}
