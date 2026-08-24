// Serializers de metas, desejos e cápsulas (compartilhados entre rotas e páginas).

export function serializeGoal(g: any) {
  let steps: { text: string; done: boolean }[] = [];
  try {
    const v = JSON.parse(g.steps || "[]");
    if (Array.isArray(v)) steps = v.filter((s) => s && typeof s.text === "string").slice(0, 30);
  } catch {}
  const doneCount = steps.filter((s) => s.done).length;
  return {
    id: g.id,
    title: g.title,
    emoji: g.emoji,
    steps,
    done: g.done,
    doneCount,
    total: steps.length,
    createdBy: g.createdBy,
    createdAt: g.createdAt.toISOString(),
  };
}

export function serializeWish(w: any) {
  return {
    id: w.id,
    title: w.title,
    kind: w.kind,
    done: w.done,
    createdBy: w.createdBy,
    createdAt: w.createdAt.toISOString(),
  };
}

// Cápsulas lacradas nunca revelam o conteúdo antes da data.
export function serializeCapsule(c: any, meId: string) {
  const unlocked = c.openAt.getTime() <= Date.now();
  return {
    id: c.id,
    title: c.title,
    content: unlocked ? c.content : "",
    unlocked,
    openAt: c.openAt.toISOString(),
    openedAt: c.openedAt ? c.openedAt.toISOString() : null,
    isMine: c.authorId === meId,
    authorId: c.authorId,
    vessel: c.vessel || "bottle",
    status: c.status || (unlocked ? "OPENED" : "SEALED"),
    createdAt: c.createdAt.toISOString(),
    items: unlocked
      ? (c.items ?? []).map((i: any) => ({
          id: i.id,
          message: i.message,
          mood: i.mood,
          image: i.image,
          isMine: i.authorId === meId,
          createdAt: i.createdAt?.toISOString?.() || i.createdAt,
        }))
      : [],
    itemCount: (c.items ?? []).length,
  };
}
