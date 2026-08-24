import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, requireIdentity, bad, json, handle } from "@/nucleo/api";
import { entryInclude, serializeEntry, feedWhere, AI_COMMENT_INCLUDE, FEED_PAGE_SIZE } from "@/nucleo/memorias";
import { sanitizeHtml, toPlain } from "@/nucleo/sanitizacao";
import { analyzeEntry, awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { notifyPartner, entryUrl } from "@/nucleo/notificacoes";
import { fmtDate, isRetroactive } from "@/nucleo/utilitarios";

const createSchema = z.object({
  title: z.string().trim().max(140).optional(),
  content: z.string().max(20000).default(""),
  mood: z.string().max(30).optional().nullable(),
  visibility: z.enum(["shared", "private"]).default("shared"),
  entryDate: z.string().datetime().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  place: z.string().trim().max(120).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().max(2_000_000),
        type: z.enum(["image", "audio", "video"]).default("image"),
        caption: z.string().max(200).nullable().optional(),
        duration: z.number().int().min(0).max(3600).nullable().optional(),
      })
    )
    .max(16)
    .optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    const url = new URL(req.url);
    const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
    const mine = url.searchParams.get("mine") === "1";
    const cursor = url.searchParams.get("cursor") || undefined;
    const rawLimit = url.searchParams.get("limit");
    const requestedLimit = rawLimit === null ? Number.NaN : Number(rawLimit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(30, Math.max(1, Math.trunc(requestedLimit)))
      : FEED_PAGE_SIZE;

    const where = mine ? { authorId: user.id } : feedWhere(user);
    const [rows, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ entryDate: order }, { createdAt: order }, { id: order }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.entry.count({ where }),
    ]);
    const hasMore = rows.length > limit;
    const entries = hasMore ? rows.slice(0, limit) : rows;
    return json({
      entries: entries.map((entry) => serializeEntry(entry, user.id)),
      total,
      nextCursor: hasMore ? entries.at(-1)?.id ?? null : null,
    });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    const content = sanitizeHtml(d.content);
    const plain = toPlain(content);
    const photos = d.attachments?.length ?? 0;

    if (!plain.trim() && !d.title?.trim() && !photos) {
      return bad("Escreva algo ou adicione uma foto.");
    }

    const { points, insight, plans } = await analyzeEntry(user, plain, d.mood || null, photos);

    const entry = await prisma.entry.create({
      data: {
        authorId: user.id,
        coupleId: user.coupleId,
        title: d.title?.trim() || null,
        content,
        mood: d.mood || null,
        insight,
        points,
        visibility: user.coupleId ? d.visibility : "private",
        entryDate: d.entryDate ? new Date(d.entryDate) : new Date(),
        tags: JSON.stringify(d.tags ?? []),
        place: d.place || null,
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        attachments: d.attachments?.length
          ? { create: d.attachments.map((a) => ({ url: a.url, type: a.type, caption: a.caption ?? null, duration: a.duration ?? null })) }
          : undefined,
      },
      include: entryInclude,
    });
    // A memória já existe neste ponto. Falha secundária em pontos/sequência
    // não deve responder 500 e induzir a pessoa a publicar tudo de novo.
    const [, streak] = await Promise.all([
      awardPoints(user.id, points).catch(() => null),
      touchStreak(user.id).catch(() => null),
    ]);

    // O comentário da IA (antes era o "insight" colado no post) agora entra na
    // thread de comentários, assinado pelo Cupido.
    if (insight) {
      const aiComment = await prisma.comment
        .create({
          data: { entryId: entry.id, aiCharacter: "cupido", content: insight },
          include: AI_COMMENT_INCLUDE,
        })
        .catch(() => null);
      if (aiComment) entry.comments.push(aiComment as any);
    }

    // Avisa o parceiro (só o que é compartilhado)
    if (entry.visibility === "shared") {
      const quem = user.displayName || user.name;
      const resumo = entry.title || plain.slice(0, 90) || "Toque para ler";
      // Memória com data retroativa: deixa claro de que dia ela é.
      const retro = isRetroactive(entry.entryDate, entry.createdAt);
      notifyPartner(user.id, user.coupleId, {
        kind: "entry",
        title: retro
          ? `${quem} guardou uma memória de ${fmtDate(entry.entryDate)} 🕰️`
          : `${quem} escreveu uma memória 💜`,
        body: retro ? `${resumo} · publicado agora` : resumo,
        url: entryUrl(entry.id),
        entityType: "entry",
        entityId: entry.id,
        emoji: retro ? "🕰️" : "📖",
      }).catch(() => {});
    }
    return json(
      { entry: serializeEntry(entry, user.id), pointsAwarded: points, insight, streak, plans },
      201
    );
  });
}
