import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { serializeGoal } from "@/nucleo/planos";
import { notifyPartner } from "@/nucleo/notificacoes";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ goals: [] });
    const goals = await prisma.goal.findMany({
      where: { coupleId: user.coupleId },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    });
    return json({ goals: goals.map(serializeGoal) });
  });
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome à meta.").max(120),
  emoji: z.string().max(8).optional(),
  steps: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para criar metas juntos.");
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const goal = await prisma.goal.create({
      data: {
        coupleId: user.coupleId,
        createdBy: user.id,
        title: parsed.data.title,
        emoji: parsed.data.emoji || "🎯",
        steps: JSON.stringify((parsed.data.steps ?? []).map((text) => ({ text, done: false }))),
      },
    });
    await awardPoints(user.id, 3);
    await touchStreak(user.id);

    notifyPartner(user.id, user.coupleId, {
      kind: "goal",
      title: `${user.displayName || user.name} criou uma meta ${goal.emoji}`,
      body: goal.title,
      url: "/app/planos?aba=metas",
      entityType: "goal",
      entityId: goal.id,
      emoji: goal.emoji,
    }).catch(() => {});

    return json({ goal: serializeGoal(goal) }, 201);
  });
}
