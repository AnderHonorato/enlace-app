export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, requireIdentity, bad, json, handle } from "@/nucleo/api";
import { eventMap, eventOfTheDay, eventDayKey } from "@/nucleo/eventos";
import { notify } from "@/nucleo/notificacoes";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";

function serialize(s: any) {
  return {
    id: s.id,
    kind: s.kind,
    prompt: s.prompt,
    eventId: s.eventId,
    opened: !!s.openedAt,
    createdAt: s.createdAt.toISOString(),
    sender: s.sender
      ? {
          name: s.sender.name,
          displayName: s.sender.displayName,
          avatarColor: s.sender.avatarColor,
          avatarUrl: s.sender.avatarUrl,
        }
      : null,
    // Conteúdo só sai depois de aberto (PUT). Aqui vem lacrado.
  };
}

/** Segredos pendentes (não abertos) + estado do evento de hoje. */
export async function GET() {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return json({ pending: [], event: null, doneToday: false });

    const [pending, event] = await Promise.all([
      prisma.secret.findMany({
        where: { recipientId: user.id, openedAt: null },
        include: { sender: { select: { name: true, displayName: true, avatarColor: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      Promise.resolve(eventOfTheDay(user.coupleId)),
    ]);

    // O evento de hoje já foi cumprido por mim?
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const doneToday =
      (await prisma.secret.count({
        where: { senderId: user.id, eventId: event.id, createdAt: { gte: start } },
      })) > 0;

    return json({
      pending: pending.map(serialize),
      event: { id: event.id, emoji: event.emoji, prompt: event.prompt, kind: event.kind, placeholder: event.placeholder ?? "" },
      doneToday,
      dayKey: eventDayKey(),
    });
  });
}

const schema = z
  .object({
    eventId: z.string().min(1).max(60),
    message: z.string().trim().max(2000).default(""),
    image: z.string().max(2_000_000).optional().nullable(),
  })
  .refine((d) => d.message.trim().length > 0 || !!d.image, {
    message: "Escreva algo ou adicione uma foto para o segredo.",
  });

/** Cumpre um evento e envia o segredo lacrado ao parceiro. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para enviar segredos.");

    const partner = await prisma.user.findFirst({
      where: { coupleId: user.coupleId, id: { not: user.id } },
      select: { id: true },
    });
    if (!partner) return bad("Seu amor ainda não entrou no diário.");

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const { eventId, message, image } = parsed.data;

    const ev = eventMap[eventId];
    if (!ev) return bad("Evento inválido.", 404);
    if (ev.kind === "photo" && !image) return bad("Esse evento pede uma foto.");

    const secret = await prisma.secret.create({
      data: {
        coupleId: user.coupleId,
        senderId: user.id,
        recipientId: partner.id,
        eventId: ev.id,
        kind: image && message ? "mixed" : image ? "photo" : "text",
        prompt: ev.prompt,
        message,
        image: image ?? null,
      },
    });

    await awardPoints(user.id, 6);
    await touchStreak(user.id);

    const quem = user.displayName || user.name;
    notify({
      userId: partner.id,
      actorId: user.id,
      kind: "secret",
      title: `${quem} te mandou um segredo ${ev.emoji}`,
      body: `${quem} ${ev.teaser}. Toque para abrir.`,
      url: "/app?segredo=1",
      entityType: "secret",
      entityId: secret.id,
      emoji: "🔒",
    }).catch(() => {});

    return json({ ok: true, id: secret.id }, 201);
  });
}
