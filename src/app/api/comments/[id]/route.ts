import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: { entry: { select: { authorId: true } } },
    });
    if (!comment) return bad("Comentário não encontrado.", 404);
    // Autor do comentário ou dono da entrada podem apagar.
    if (comment.authorId !== user.id && comment.entry.authorId !== user.id) {
      return bad("Sem permissão.", 403);
    }
    await prisma.comment.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
