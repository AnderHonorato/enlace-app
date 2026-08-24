import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { serializeTarefa } from "@/nucleo/tarefas";
import { touchStreak } from "@/nucleo/sequencia";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ tarefas: [] });

    const lists = await prisma.taskList.findMany({
      where: { coupleId: user.coupleId },
      include: { tasks: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return json({
      tarefas: lists.map((l) => ({
        id: l.id,
        title: l.title,
        tasks: l.tasks.map((t) => serializeTarefa(t, user.id)),
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  });
}

const createListSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome para a lista.").max(80),
});

const createTaskSchema = z.object({
  listId: z.string().min(1),
  content: z.string().trim().min(1, "Descreva a tarefa.").max(2000),
  images: z.array(z.string().max(2_000_000)).max(6).optional(),
  files: z.array(z.object({ name: z.string().max(200), url: z.string().max(2_000_000), size: z.number().max(50_000_000) })).max(6).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para criar tarefas juntos.");

    const body = await req.json().catch(() => ({}));

    // Criar lista
    if (body.title !== undefined) {
      const parsed = createListSchema.safeParse(body);
      if (!parsed.success) return bad(parsed.error.errors[0].message);

      const list = await prisma.taskList.create({
        data: { coupleId: user.coupleId, title: parsed.data.title },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
      });

      await touchStreak(user.id);
      return json({ lista: { id: list.id, title: list.title, tasks: [], createdAt: list.createdAt.toISOString(), updatedAt: list.updatedAt.toISOString() } }, 201);
    }

    // Criar tarefa dentro da lista
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const list = await prisma.taskList.findUnique({ where: { id: parsed.data.listId } });
    if (!list || list.coupleId !== user.coupleId) return bad("Lista não encontrada.", 404);

    const task = await prisma.taskItem.create({
      data: {
        listId: parsed.data.listId,
        authorId: user.id,
        content: parsed.data.content,
        images: JSON.stringify(parsed.data.images ?? []),
        files: JSON.stringify(parsed.data.files ?? []),
        comments: "[]",
      },
    });

    await touchStreak(user.id);
    return json({ tarefa: serializeTarefa(task, user.id) }, 201);
  });
}
