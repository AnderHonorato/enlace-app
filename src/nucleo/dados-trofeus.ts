import "server-only";
import { prisma } from "./prisma";
import { feedWhere } from "./memorias";
import { toPlain } from "./sanitizacao";
import { levelFromPoints } from "./pontos";
import type { AchievementInput } from "./conquistas";

/**
 * Junta os números do casal que alimentam os troféus.
 *
 * Lê tudo de uma vez porque o hall mostra o histórico completo — não é uma
 * visão por período como a retrospectiva.
 */
export async function trophyInput(user: {
  id: string;
  coupleId: string | null;
  points: number;
}): Promise<AchievementInput> {
  const where = { ...feedWhere({ id: user.id, coupleId: user.coupleId }), locked: false };

  const [entries, capsules, members] = await Promise.all([
    prisma.entry.findMany({
      where,
      select: {
        content: true,
        entryDate: true,
        authorId: true,
        place: true,
        attachments: { select: { type: true } },
        reactions: { select: { id: true } },
        comments: { select: { id: true } },
      },
    }),
    user.coupleId ? prisma.capsule.count({ where: { coupleId: user.coupleId } }) : Promise.resolve(0),
    user.coupleId
      ? prisma.user.findMany({ where: { coupleId: user.coupleId }, select: { id: true, points: true } })
      : Promise.resolve([{ id: user.id, points: user.points }]),
  ]);

  let words = 0;
  let photos = 0;
  let likes = 0;
  let comments = 0;
  let lateNights = 0;
  const places = new Set<string>();
  const perAuthor = new Map<string, number>();
  const days = new Set<string>();
  const months = new Set<string>();

  for (const e of entries) {
    const plain = toPlain(e.content);
    if (plain) words += plain.split(/\s+/).filter(Boolean).length;
    photos += e.attachments.filter((a) => a.type === "image").length;
    likes += e.reactions.length;
    comments += e.comments.length;
    if (e.place) places.add(e.place);
    perAuthor.set(e.authorId, (perAuthor.get(e.authorId) ?? 0) + 1);

    const d = e.entryDate;
    if (d.getHours() >= 0 && d.getHours() < 5) lateNights++;
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    months.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const couple = user.coupleId
    ? await prisma.couple.findUnique({ where: { id: user.coupleId }, select: { anniversary: true } })
    : null;

  const connectionPoints = members.reduce((sum, mm) => sum + mm.points, 0);

  return {
    total: entries.length,
    words,
    photos,
    likes,
    comments,
    places: places.size,
    capsules,
    daysTogether: couple?.anniversary
      ? Math.floor((Date.now() - couple.anniversary.getTime()) / 86400000)
      : null,
    level: levelFromPoints(connectionPoints),
    bestStreak: longestStreak(days),
    authorCounts: [...perAuthor.values()].sort((a, b) => b - a),
    activeMonths: months.size,
    lateNights,
  };
}

/** Maior sequência de dias consecutivos com pelo menos um registro. */
function longestStreak(days: Set<string>): number {
  const times = [...days]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const t of times) {
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    prev = t;
    if (run > best) best = run;
  }
  return best;
}
