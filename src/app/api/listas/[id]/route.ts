import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

const patchSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome para a lista.").max(80).optional(),
});

async function ownList(id: string, coupleId: string | null) {
  if (!coupleId) return null;
  const list = await prisma.taskList.findUnique({ where: { id } });
  return list && list.coupleId === coupleId ? list : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const list = await ownList(params.id, user.coupleId);
    if (!list) return bad("Lista não encontrada.", 404);
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const updated = await prisma.taskList.update({
      where: { id: list.id },
      data: { title: parsed.data.title },
      include: { tasks: { orderBy: { createdAt: "asc" } } },
    });
    return json({ id: updated.id, title: updated.title, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const list = await ownList(params.id, user.coupleId);
    if (!list) return bad("Lista não encontrada.", 404);
    await prisma.taskList.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
