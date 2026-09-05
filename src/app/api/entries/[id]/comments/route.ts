import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { authorSelect } from "@/nucleo/memorias";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { notify, commentUrl } from "@/nucleo/notificacoes";
import { POINTS } from "@/nucleo/pontos";

const schema = z
  .object({
    content: z.string().trim().max(2000).default(""),
    images: z.array(z.string().max(2_000_000)).max(4).optional(),
  })
  .refine((d) => d.content.trim().length > 0 || (d.images?.length ?? 0) > 0, {
    message: "Escreva um comentário ou adicione uma foto.",
  });

type ContextoRota = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) return bad("Entrada não encontrada.", 404);

    const canSee =
      entry.authorId === user.id ||
      (!!entry.coupleId && entry.coupleId === user.coupleId && entry.visibility === "shared");
    if (!canSee) return bad("Você não pode comentar aqui.", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const images = parsed.data.images ?? [];
    const comment = await prisma.comment.create({
      data: {
        entryId: id,
        authorId: user.id,
        content: parsed.data.content,
        images: JSON.stringify(images),
      },
      include: { author: { select: authorSelect } },
    });
    await awardPoints(user.id, POINTS.comment);
    await touchStreak(user.id);

    const quem = user.displayName || user.name;
    const trecho = parsed.data.content.slice(0, 120) || "Mandou uma foto 📷";
    const link = commentUrl(entry.id, comment.id);

    // Avisa o autor da memória e quem mais já comentou nela (menos você).
    // Comentários da IA têm authorId nulo — não entram como destinatário.
    const outros = await prisma.comment.findMany({
      where: { entryId: id, authorId: { notIn: [user.id, entry.authorId] } },
      select: { authorId: true },
      distinct: ["authorId"],
    });
    const destinatarios = new Set<string>([entry.authorId]);
    for (const c of outros) if (c.authorId) destinatarios.add(c.authorId);
    destinatarios.delete(user.id);

    for (const userId of destinatarios) {
      notify({
        userId,
        actorId: user.id,
        kind: "comment",
        title:
          userId === entry.authorId
            ? `${quem} comentou na sua memória 💬`
            : `${quem} também comentou 💬`,
        body: trecho,
        url: link,
        entityType: "comment",
        entityId: comment.id,
      }).catch(() => {});
    }

    return json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          images,
          createdAt: comment.createdAt.toISOString(),
          author: comment.author,
          isAI: false,
          isMine: true,
          likeCount: 0,
          likedByMe: false,
        },
      },
      201
    );
  });
}
