import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { serializeCapsule } from "@/nucleo/planos";
import { notifyPartner } from "@/nucleo/notificacoes";
import { fmtDate } from "@/nucleo/utilitarios";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ capsules: [] });
    const capsules = await prisma.capsule.findMany({
      where: { coupleId: user.coupleId },
      include: { items: { orderBy: { createdAt: "asc" } } },
      orderBy: { openAt: "asc" },
    });
    return json({ capsules: capsules.map((c) => serializeCapsule(c, user.id)) });
  });
}

const createSchema = z.object({
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(1, "Escreva uma mensagem.").max(10000),
  openAt: z.string().datetime(),
  vessel: z.enum(["bottle", "globe", "chest", "bear", "box"]).optional(),
  items: z
    .array(
      z.object({
        message: z.string().trim().min(1).max(2000),
        mood: z.string().max(30).nullable().optional(),
        image: z.string().max(2000).nullable().optional(),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para criar cápsulas do tempo.");
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;
    const openAt = new Date(d.openAt);
    if (openAt.getTime() <= Date.now()) return bad("Escolha uma data no futuro.");

    const capsule = await prisma.capsule.create({
      data: {
        coupleId: user.coupleId,
        authorId: user.id,
        title: d.title?.trim() || null,
        content: d.content,
        openAt,
        vessel: d.vessel || "bottle",
        items: d.items?.length
          ? {
              create: d.items.map((item) => ({
                authorId: user.id,
                message: item.message,
                mood: item.mood || null,
                image: item.image || null,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    await awardPoints(user.id, 10);
    await touchStreak(user.id);

    notifyPartner(user.id, user.coupleId, {
      kind: "capsule",
      title: `${user.displayName || user.name} lacrou uma cápsula do tempo 💌`,
      body: `${capsule.title || "Sem título"} · abre em ${fmtDate(openAt)}`,
      url: "/app/planos?aba=capsulas",
      entityType: "capsule",
      entityId: capsule.id,
    }).catch(() => {});

    return json({ capsule: serializeCapsule(capsule, user.id), pointsAwarded: 10 }, 201);
  });
}
