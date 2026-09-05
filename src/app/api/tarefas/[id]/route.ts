import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { serializeTarefa } from "@/nucleo/tarefas";

const patchSchema = z.object({
  content: z.string().trim().min(1).max(2000).optional(),
  done: z.boolean().optional(),
  images: z.array(z.string().max(2_000_000)).max(6).optional(),
  files: z.array(z.object({ name: z.string().max(200), url: z.string().max(2_000_000), size: z.number().max(50_000_000) })).max(6).optional(),
});

async function ownTask(id: string, coupleId: string | null) {
  if (!coupleId) return null;
  const task = await prisma.taskItem.findUnique({ where: { id }, include: { list: true } });
  return task && task.list.coupleId === coupleId ? task : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const task = await ownTask((await params).id, user.coupleId);
    if (!task) return bad("Tarefa não encontrada.", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    const updated = await prisma.taskItem.update({
      where: { id: task.id },
      data: {
        content: d.content,
        done: d.done,
        images: d.images !== undefined ? JSON.stringify(d.images) : undefined,
        files: d.files !== undefined ? JSON.stringify(d.files) : undefined,
      },
    });

    return json({ tarefa: serializeTarefa(updated, user.id) });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    // Permite deletar se for autor OU se ambos estão no casal
    const task = await prisma.taskItem.findUnique({ where: { id: (await params).id }, include: { list: true } });
    if (!task || task.list.coupleId !== user.coupleId) return bad("Tarefa não encontrada.", 404);

    await prisma.taskItem.delete({ where: { id: (await params).id } });
    return json({ ok: true });
  });
}
