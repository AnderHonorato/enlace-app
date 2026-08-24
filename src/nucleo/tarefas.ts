import type { TaskItem } from "@prisma/client";

export function serializeTarefa(t: TaskItem, meId: string) {
  let images: string[] = [];
  let files: { name: string; url: string; size: number }[] = [];
  let comments: { id: string; authorId: string; authorName: string; authorAvatar: string; text: string; createdAt: string }[] = [];
  try { images = JSON.parse(t.images || "[]"); } catch {}
  try { files = JSON.parse(t.files || "[]"); } catch {}
  try { comments = JSON.parse(t.comments || "[]"); } catch {}

  return {
    id: t.id,
    listId: t.listId,
    authorId: t.authorId,
    content: t.content,
    done: t.done,
    images,
    files,
    comments,
    isMine: t.authorId === meId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export type TarefaDTO = ReturnType<typeof serializeTarefa>;
