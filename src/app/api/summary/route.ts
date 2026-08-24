import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import {
  generateSummary,
  dayKeyFor,
  periodKeyFor,
  PERIOD_WINDOW_DAYS,
  PERIOD_LABEL,
  type EntryLite,
  type SummaryPeriod,
} from "@/nucleo/resumo";
import { notifyPartner } from "@/nucleo/notificacoes";
import { moodOf } from "@/nucleo/humores";
import { toPlain } from "@/nucleo/sanitizacao";
import { fmtDay } from "@/nucleo/utilitarios";

function serialize(s: any) {
  return {
    id: s.id,
    day: s.day,
    period: s.period ?? "day",
    vibe: s.vibe,
    title: s.title,
    message: s.message,
    tip: s.tip,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ today: null, history: [] });
    const day = dayKeyFor();
    const [today, history] = await Promise.all([
      prisma.dailySummary.findUnique({ where: { coupleId_day: { coupleId: user.coupleId, day } } }),
      prisma.dailySummary.findMany({ where: { coupleId: user.coupleId }, orderBy: { createdAt: "desc" }, take: 60 }),
    ]);
    return json({ today: today ? serialize(today) : null, history: history.map(serialize) });
  });
}

const postSchema = z.object({ period: z.enum(["day", "week", "month"]).default("day") });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você precisa estar conectado a um casal para gerar o resumo.");

    const body = await req.json().catch(() => ({}));
    const period: SummaryPeriod = postSchema.parse(body ?? {}).period;

    const since = new Date(Date.now() - PERIOD_WINDOW_DAYS[period] * 86400000);
    // O resumo é lido pelos DOIS parceiros — nunca pode citar uma memória
    // trancada (senha) nem uma memória "só minha" de qualquer um dos dois.
    // Ver src/nucleo/entries.ts (serializeEntry) para a mesma regra no feed.
    const entries = await prisma.entry.findMany({
      where: { coupleId: user.coupleId, entryDate: { gte: since }, locked: false, visibility: "shared" },
      include: { author: { select: { name: true, displayName: true } } },
      orderBy: { entryDate: "desc" },
      take: period === "month" ? 60 : 30,
    });

    const members = await prisma.user.findMany({
      where: { coupleId: user.coupleId },
      select: { name: true, displayName: true },
    });
    const names = {
      a: members[0]?.displayName || members[0]?.name || "Você",
      b: members[1] ? members[1].displayName || members[1].name : null,
    };

    const lite: EntryLite[] = entries.map((e) => ({
      authorName: e.author.displayName || e.author.name,
      moodLabel: moodOf(e.mood)?.label ?? null,
      moodKey: e.mood,
      date: fmtDay(e.entryDate),
      text: toPlain(e.content) || e.title || "",
    }));

    const { source, ...result } = await generateSummary(user, lite, names, period);
    const day = periodKeyFor(period);
    const saved = await prisma.dailySummary.upsert({
      where: { coupleId_day: { coupleId: user.coupleId, day } },
      update: { vibe: result.vibe, title: result.title, message: result.message, tip: result.tip, period },
      create: { coupleId: user.coupleId, day, period, ...result },
    });

    // O parceiro também quer saber que saiu resumo novo.
    notifyPartner(user.id, user.coupleId, {
      kind: "summary",
      title: `Novo resumo ${PERIOD_LABEL[period]} ✦`,
      body: `${result.title} — ${result.message.slice(0, 90)}`,
      url: "/app/resumos",
      entityType: "summary",
      entityId: saved.id,
    }).catch(() => {});

    return json({ summary: serialize(saved), source });
  });
}
