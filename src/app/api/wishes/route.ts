import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { serializeWish } from "@/nucleo/planos";
import { notifyPartner } from "@/nucleo/notificacoes";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ wishes: [] });
    const wishes = await prisma.wish.findMany({
      where: { coupleId: user.coupleId },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    });
    return json({ wishes: wishes.map(serializeWish) });
  });
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Escreva o desejo.").max(160),
  kind: z.enum(["date", "lugar", "sonho", "outro"]).default("date"),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para criar a lista de vocês.");
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const wish = await prisma.wish.create({
      data: {
        coupleId: user.coupleId,
        createdBy: user.id,
        title: parsed.data.title,
        kind: parsed.data.kind,
      },
    });
    await awardPoints(user.id, 3);
    await touchStreak(user.id);

    notifyPartner(user.id, user.coupleId, {
      kind: "wish",
      title: `${user.displayName || user.name} adicionou um desejo ⭐`,
      body: wish.title,
      url: "/app/planos?aba=desejos",
      entityType: "wish",
      entityId: wish.id,
    }).catch(() => {});

    return json({ wish: serializeWish(wish) }, 201);
  });
}
