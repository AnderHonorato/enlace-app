import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { POINTS } from "@/nucleo/pontos";
import { notify, entryUrl } from "@/nucleo/notificacoes";
import { toPlain } from "@/nucleo/sanitizacao";

const schema = z.object({ emoji: z.string().max(8).default("❤️") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const entry = await prisma.entry.findUnique({ where: { id: (await params).id } });
    if (!entry) return bad("Entrada não encontrada.", 404);

    const canSee =
      entry.authorId === user.id ||
      (!!entry.coupleId && entry.coupleId === user.coupleId && entry.visibility === "shared");
    if (!canSee) return bad("Você não pode reagir aqui.", 403);

    const body = await req.json().catch(() => ({}));
    const emoji = schema.parse(body).emoji;

    const existing = await prisma.reaction.findUnique({
      where: { entryId_userId_emoji: { entryId: (await params).id, userId: user.id, emoji } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.reaction.create({ data: { entryId: (await params).id, userId: user.id, emoji } });
      await awardPoints(user.id, POINTS.reaction);
      liked = true;

      // Avisa quem escreveu a memória. Só ao reagir — desfazer não notifica.
      const quem = user.displayName || user.name;
      const oque = entry.title || toPlain(entry.content).slice(0, 80) || "sua memória";
      notify({
        userId: entry.authorId,
        actorId: user.id,
        kind: "reaction",
        title: `${quem} reagiu ${emoji} à sua memória`,
        body: oque,
        url: entryUrl(entry.id),
        entityType: "entry",
        entityId: entry.id,
        emoji,
      }).catch(() => {});
    }

    const count = await prisma.reaction.count({ where: { entryId: (await params).id, emoji } });
    return json({ liked, count });
  });
}
