import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

/** Abre um segredo destinado a mim e revela o conteúdo. */
export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const secret = await prisma.secret.findUnique({
      where: { id: params.id },
      include: { sender: { select: { name: true, displayName: true, avatarColor: true, avatarUrl: true } } },
    });
    if (!secret) return bad("Segredo não encontrado.", 404);
    if (secret.recipientId !== user.id) return bad("Este segredo não é seu.", 403);

    if (!secret.openedAt) {
      await prisma.secret.update({ where: { id: secret.id }, data: { openedAt: new Date() } });
    }

    return json({
      secret: {
        id: secret.id,
        kind: secret.kind,
        prompt: secret.prompt,
        eventId: secret.eventId,
        message: secret.message,
        image: secret.image,
        createdAt: secret.createdAt.toISOString(),
        sender: {
          name: secret.sender.name,
          displayName: secret.sender.displayName,
          avatarColor: secret.sender.avatarColor,
          avatarUrl: secret.sender.avatarUrl,
        },
      },
    });
  });
}
