import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireIdentity, json, handle } from "@/nucleo/api";
import { serializeNotification } from "@/nucleo/notificacoes";
import { authorSelect } from "@/nucleo/memorias";

/** Lista as notificações do usuário + quantas não lidas. */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    const url = new URL(req.url);
    const onlyCount = url.searchParams.get("count") === "1";

    const unread = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    if (onlyCount) return json({ unread, notifications: [] });

    const rows = await prisma.notification.findMany({
      where: { userId: user.id },
      include: { actor: { select: authorSelect } },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return json({ unread, notifications: rows.map(serializeNotification) });
  });
}

const postSchema = z.object({
  /** Marca uma notificação específica como lida; sem id, marca todas. */
  id: z.string().min(1).optional(),
});

/** Marca como lida(s). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    const body = await req.json().catch(() => ({}));
    const { id } = postSchema.parse(body ?? {});

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    }

    const unread = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return json({ ok: true, unread });
  });
}

/** Limpa o histórico de notificações. */
export async function DELETE() {
  return handle(async () => {
    const user = await requireIdentity();
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    return json({ ok: true, unread: 0 });
  });
}
