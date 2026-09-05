import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { POINTS } from "@/nucleo/pontos";
import { notify, commentUrl } from "@/nucleo/notificacoes";

const schema = z.object({ emoji: z.string().max(8).default("❤️") });
type ContextoRota = { params: Promise<{ id: string }> };

/** Curte / descurte um comentário. */
export async function POST(req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        entry: { select: { id: true, authorId: true, coupleId: true, visibility: true } },
        author: { select: { id: true } },
      },
    });
    if (!comment) return bad("Comentário não encontrado.", 404);

    const e = comment.entry;
    const canSee =
      e.authorId === user.id ||
      (!!e.coupleId && e.coupleId === user.coupleId && e.visibility === "shared");
    if (!canSee) return bad("Você não pode curtir aqui.", 403);

    const body = await req.json().catch(() => ({}));
    const emoji = schema.parse(body).emoji;

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: id, userId: user.id } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.commentLike.create({ data: { commentId: id, userId: user.id, emoji } });
      await awardPoints(user.id, POINTS.reaction);
      liked = true;

      // Comentário da IA não tem autor humano — não há quem notificar.
      if (comment.authorId) {
        notify({
          userId: comment.authorId,
          actorId: user.id,
          kind: "comment_like",
          title: `${user.displayName || user.name} curtiu seu comentário ${emoji}`,
          body: comment.content.slice(0, 120) || "Sua foto no comentário",
          url: commentUrl(e.id, comment.id),
          entityType: "comment",
          entityId: comment.id,
          emoji,
        }).catch(() => {});
      }
    }

    const count = await prisma.commentLike.count({ where: { commentId: id } });
    return json({ liked, count });
  });
}
