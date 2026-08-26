import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, requireIdentity, requireSameOrigin, bad, json, handle } from "@/nucleo/api";
import { entryInclude, serializeEntry, feedWhere, FEED_PAGE_SIZE } from "@/nucleo/memorias";
import { sanitizeHtml, toPlain } from "@/nucleo/sanitizacao";
import { analyzeEntry, awardPoints } from "@/nucleo/recompensa";
import { baseEntryPoints } from "@/nucleo/pontos";
import { touchStreak } from "@/nucleo/sequencia";
import { notifyPartner, entryUrl } from "@/nucleo/notificacoes";
import { validarUploadsDoCasal } from "@/nucleo/uploads-privados";
import { fmtDate, isRetroactive } from "@/nucleo/utilitarios";

const CONTAGEM_TTL_MS = 60_000;
const contagensFeed = new Map<string, { total: number; expiraEm: number }>();

function chaveContagem(userId: string, mine: boolean) {
  return `${userId}:${mine ? "mine" : "feed"}`;
}

async function contarFeed(userId: string, mine: boolean, where: Prisma.EntryWhereInput) {
  const chave = chaveContagem(userId, mine);
  const agora = Date.now();
  const cache = contagensFeed.get(chave);
  if (cache && cache.expiraEm > agora) return cache.total;

  const total = await prisma.entry.count({ where });
  if (contagensFeed.size > 500) contagensFeed.clear();
  contagensFeed.set(chave, { total, expiraEm: agora + CONTAGEM_TTL_MS });
  return total;
}

function invalidarContagem(userId: string) {
  contagensFeed.delete(chaveContagem(userId, false));
  contagensFeed.delete(chaveContagem(userId, true));
}

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

    const where: Prisma.EntryWhereInput = mine ? { authorId: user.id } : feedWhere(user);
    const [rows, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ entryDate: order }, { createdAt: order }, { id: order }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      contarFeed(user.id, mine, where),
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
    requireSameOrigin(req);
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    const content = sanitizeHtml(d.content);
    const plain = toPlain(content);
    const mediaCount = d.attachments?.length ?? 0;

    if (!plain.trim() && !d.title?.trim() && !mediaCount) {
      return bad("Escreva algo ou adicione uma foto.");
    }

    if (user.coupleId && d.attachments?.length) {
      const uploadsValidos = await validarUploadsDoCasal(
        user.coupleId,
        d.attachments.map((anexo) => anexo.url)
      );
      if (!uploadsValidos) return bad("Um dos arquivos não pertence a este casal.", 403);
    }

    const pontosBase = baseEntryPoints({
      contentLength: plain.length,
      hasMood: !!d.mood,
      photos: mediaCount,
    });

    // A memória é persistida antes de qualquer chamada de IA. A pessoa recebe
    // resposta assim que banco, pontos-base e sequência terminam; análise e
    // comentário do Cupido continuam depois da resposta com `after()`.
    const entry = await prisma.entry.create({
      data: {
        authorId: user.id,
        coupleId: user.coupleId,
        title: d.title?.trim() || null,
        content,
        mood: d.mood || null,
        insight: null,
        points: pontosBase,
        visibility: user.coupleId ? d.visibility : "private",
        entryDate: d.entryDate ? new Date(d.entryDate) : new Date(),
        tags: JSON.stringify(d.tags ?? []),
        place: d.place || null,
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        attachments: d.attachments?.length
          ? {
              create: d.attachments.map((a) => ({
                url: a.url,
                type: a.type,
                caption: a.caption ?? null,
                duration: a.duration ?? null,
              })),
            }
          : undefined,
      },
      include: entryInclude,
    });

    const [, streak] = await Promise.all([
      awardPoints(user.id, pontosBase).catch(() => null),
      touchStreak(user.id).catch(() => null),
    ]);

    invalidarContagem(user.id);
    for (const membro of user.couple?.members ?? []) invalidarContagem(membro.id);

    after(async () => {
      const resultado = await analyzeEntry(user, plain, d.mood || null, mediaCount).catch(() => null);
      if (!resultado) return;

      const { points, insight, plans } = resultado;
      const atualizada = await prisma.entry
        .update({ where: { id: entry.id }, data: { points, insight } })
        .catch(() => null);
      if (!atualizada) return;

      const bonusIA = Math.max(0, points - pontosBase);
      if (bonusIA > 0) await awardPoints(user.id, bonusIA).catch(() => null);

      if (insight) {
        await prisma.comment
          .create({ data: { entryId: entry.id, aiCharacter: "cupido", content: insight } })
          .catch(() => null);
      }

      // O antigo modal de planos dependia da resposta lenta da IA. Em segundo
      // plano, preservamos a descoberta sem criar desejos sem consentimento:
      // a pessoa recebe um aviso e decide o que fazer ao abrir a memória.
      if (plans.length) {
        const titulos = plans.slice(0, 2).map((plan) => plan.title).join(" · ");
        await prisma.notification
          .create({
            data: {
              userId: user.id,
              kind: "summary",
              title: "A IA percebeu um plano de vocês ✨",
              body: titulos,
              url: entryUrl(entry.id),
              entityType: "entry",
              entityId: entry.id,
              emoji: "✨",
            },
          })
          .catch(() => null);
      }
    });

    if (entry.visibility === "shared") {
      const quem = user.displayName || user.name;
      const resumo = entry.title || plain.slice(0, 90) || "Toque para ler";
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
      {
        entry: serializeEntry(entry, user.id),
        pointsAwarded: pontosBase,
        insight: null,
        streak,
        plans: [],
        analysisPending: true,
      },
      201
    );
  });
}
