import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { entryInclude, serializeEntry, feedWhere, FEED_PAGE_SIZE } from "@/nucleo/memorias";
import { dayKeyFor } from "@/nucleo/resumo";
import { streakStatus } from "@/nucleo/sequencia";
import { challengeOfTheWeek, startOfWeek, missionsOfTheDay } from "@/nucleo/desafios";
import { mascotData } from "@/nucleo/dados-mascote";
import { LinhaDoTempo } from "@/componentes/LinhaDoTempo";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ memoria?: string }>;
}) {
  const searchParamsResolvidos = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);
  const where = feedWhere({ id: user.id, coupleId: user.coupleId });
  const challenge = challengeOfTheWeek();
  const wStart = startOfWeek();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // As leituras independentes começam juntas. A versão anterior esperava
  // várias consultas em sequência e carregava 200 publicações completas antes
  // de mostrar a primeira tela.
  const [entryRows, totalEntries, summaryRow, weekCount, weeklyEntries, mascot, historyDates] =
    await Promise.all([
      prisma.entry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: FEED_PAGE_SIZE + 1,
      }),
      prisma.entry.count({ where }),
      user.coupleId
        ? prisma.dailySummary.findUnique({
            where: { coupleId_day: { coupleId: user.coupleId, day: dayKeyFor() } },
          })
        : Promise.resolve(null),
      prisma.entry.count({ where: { ...where, entryDate: { gte: weekAgo } } }),
      prisma.entry.findMany({
        where: { ...where, entryDate: { gte: wStart } },
        select: { tags: true },
        take: 100,
      }),
      mascotData({
        id: user.id,
        coupleId: user.coupleId,
        points: user.points,
        streak: user.streak,
        bestStreak: user.bestStreak,
        lastActiveDay: user.lastActiveDay,
      }),
      prisma.entry.findMany({
        where: { ...where, entryDate: { lt: startOfYear } },
        select: { id: true, entryDate: true },
        orderBy: { entryDate: "desc" },
        take: 1000,
      }),
    ]);

  const hasMore = entryRows.length > FEED_PAGE_SIZE;
  const pageRows = hasMore ? entryRows.slice(0, FEED_PAGE_SIZE) : entryRows;

  // Uma notificação pode apontar para uma memória antiga, fora da primeira
  // página. Trazemos apenas esse cartão extra e mantemos o cursor normal.
  const targetId = typeof searchParamsResolvidos?.memoria === "string" ? searchParamsResolvidos?.memoria : null;
  const targetRow =
    targetId && !pageRows.some((entry) => entry.id === targetId)
      ? await prisma.entry.findFirst({ where: { AND: [where, { id: targetId }] }, include: entryInclude })
      : null;
  const entries = targetRow ? [...pageRows, targetRow] : pageRows;

  const summaryToday = summaryRow
    ? {
        id: summaryRow.id,
        day: summaryRow.day,
        vibe: summaryRow.vibe as "positive" | "neutral" | "attention",
        title: summaryRow.title,
        message: summaryRow.message,
        tip: summaryRow.tip,
        createdAt: summaryRow.createdAt.toISOString(),
      }
    : null;

  const names =
    me.couple?.name ||
    (me.partner
      ? `${me.displayName || me.name} & ${me.partner.displayName || me.partner.name}`
      : me.displayName || me.name);

  // "Neste dia" consulta primeiro só id/data e hidrata no máximo três cards.
  const onThisDayIds = historyDates
    .filter((entry) => entry.entryDate.getDate() === now.getDate() && entry.entryDate.getMonth() === now.getMonth())
    .slice(0, 3)
    .map((entry) => entry.id);
  const onThisDayRows = onThisDayIds.length
    ? await prisma.entry.findMany({ where: { id: { in: onThisDayIds } }, include: entryInclude })
    : [];
  const byId = new Map(onThisDayRows.map((entry) => [entry.id, entry]));
  const onThisDay = onThisDayIds.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : []));

  const st = streakStatus(user.lastActiveDay, user.streak, user.streakShields, user.shieldMonth);
  const streakInfo = {
    streak: st.streak,
    activeToday: st.activeToday,
    atRisk: st.atRisk,
    weekCount,
    weekGoal: 5,
    shields: st.shields,
    protected: st.protected,
  };

  const challengeDone = weeklyEntries.some((entry) => entry.tags.toLowerCase().includes("desafio"));
  const missions = missionsOfTheDay();
  const weekTags = new Set<string>();
  for (const entry of weeklyEntries) {
    try {
      for (const tag of JSON.parse(entry.tags || "[]")) {
        if (typeof tag === "string") weekTags.add(tag.toLowerCase());
      }
    } catch {}
  }

  return (
    <LinhaDoTempo
      initial={entries.map((entry) => serializeEntry(entry, user.id))}
      initialTotal={totalEntries}
      initialNextCursor={hasMore ? pageRows.at(-1)?.id ?? null : null}
      me={me}
      summaryToday={summaryToday}
      names={names}
      streakInfo={streakInfo}
      onThisDay={onThisDay.map((entry) => serializeEntry(entry, user.id))}
      challenge={challenge}
      challengeDone={challengeDone}
      missions={missions}
      missionDoneTags={[...weekTags]}
      lastFeedSeenAt={user.lastFeedSeenAt ? user.lastFeedSeenAt.toISOString() : null}
      mascot={mascot}
    />
  );
}
