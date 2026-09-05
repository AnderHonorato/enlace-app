import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { serializeGoal } from "@/nucleo/planos";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  emoji: z.string().max(8).optional(),
  steps: z
    .array(z.object({ text: z.string().trim().min(1).max(200), done: z.boolean() }))
    .max(30)
    .optional(),
  done: z.boolean().optional(),
});

async function ownGoal(id: string, coupleId: string | null) {
  if (!coupleId) return null;
  const goal = await prisma.goal.findUnique({ where: { id } });
  return goal && goal.coupleId === coupleId ? goal : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const goal = await ownGoal((await params).id, user.coupleId);
    if (!goal) return bad("Meta não encontrada.", 404);
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    // Meta fica concluída automaticamente quando todos os passos terminam.
    let done = d.done;
    if (d.steps && done === undefined) {
      done = d.steps.length > 0 && d.steps.every((s) => s.done);
    }

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        title: d.title,
        emoji: d.emoji,
        steps: d.steps ? JSON.stringify(d.steps) : undefined,
        done,
      },
    });
    return json({ goal: serializeGoal(updated) });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const goal = await ownGoal((await params).id, user.coupleId);
    if (!goal) return bad("Meta não encontrada.", 404);
    await prisma.goal.delete({ where: { id: goal.id } });
    return json({ ok: true });
  });
}
