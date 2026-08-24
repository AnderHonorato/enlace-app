import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { serializeTarefa } from "@/nucleo/tarefas";
import { touchStreak } from "@/nucleo/sequencia";
import { notifyPartner } from "@/nucleo/notificacoes";

const commentSchema = z.object({
  text: z.string().trim().min(1, "Escreva um comentário.").max(600),
});

async function ownTask(id: string, coupleId: string | null) {
  if (!coupleId) return null;
  const task = await prisma.taskItem.findUnique({ where: { id }, include: { list: true } });
  return task && task.list.coupleId === coupleId ? task : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor primeiro.");

    const task = await ownTask(params.id, user.coupleId);
    if (!task) return bad("Tarefa não encontrada.", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    let comments: any[] = [];
    try { comments = JSON.parse(task.comments || "[]"); } catch {}

    const novo = {
      id: Math.random().toString(36).slice(2, 10),
      authorId: user.id,
      authorName: user.displayName || user.name,
      authorAvatar: user.avatarColor,
      text: parsed.data.text,
      createdAt: new Date().toISOString(),
    };

    comments.push(novo);

    const updated = await prisma.taskItem.update({
      where: { id: task.id },
      data: { comments: JSON.stringify(comments) },
    });

    await touchStreak(user.id);

    notifyPartner(user.id, user.coupleId, {
      kind: "task_comment",
      title: `${novo.authorName} comentou em uma tarefa 💬`,
      body: `${task.content.slice(0, 60)} — ${parsed.data.text.slice(0, 80)}`,
      url: `/app/tarefas?tarefa=${task.id}`,
      entityType: "task",
      entityId: task.id,
    }).catch(() => {});

    return json({ tarefa: serializeTarefa(updated, user.id), comentario: novo });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor primeiro.");

    const url = new URL(_req.url);
    const commentId = url.searchParams.get("cid");
    if (!commentId) return bad("ID do comentário obrigatório.");

    const task = await ownTask(params.id, user.coupleId);
    if (!task) return bad("Tarefa não encontrada.", 404);

    let comments: any[] = [];
    try { comments = JSON.parse(task.comments || "[]"); } catch {}

    comments = comments.filter((c: any) => c.id !== commentId);

    const updated = await prisma.taskItem.update({
      where: { id: task.id },
      data: { comments: JSON.stringify(comments) },
    });

    return json({ tarefa: serializeTarefa(updated, user.id) });
  });
}
