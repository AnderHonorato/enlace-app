import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

// Marca/desmarca uma memória como especial do casal (qualquer um dos dois pode).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const entry = await prisma.entry.findUnique({ where: { id: params.id } });
    if (!entry) return bad("Entrada não encontrada.", 404);
    const canSee =
      entry.authorId === user.id ||
      (!!entry.coupleId && entry.coupleId === user.coupleId && entry.visibility === "shared");
    if (!canSee) return bad("Sem permissão.", 403);

    const updated = await prisma.entry.update({
      where: { id: entry.id },
      data: { favorite: !entry.favorite },
    });
    return json({ favorite: updated.favorite });
  });
}
