import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { feedWhere } from "./memorias";
import { toPlain } from "./sanitizacao";
import { levelFromPoints } from "./pontos";
import { mascotState, type MascotInput, type MascotState } from "./mascote";

export type MascotData = {
  state: MascotState;
  name: string | null;
};

/**
 * Reúne os números do casal e devolve o estado do bichinho + o nome dado.
 * Lê tudo (não é por período) — o bichinho reflete a história inteira.
 */
export type MascotUserInput = {
  id: string;
  coupleId: string | null;
  points: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
};

const readMascotData = unstable_cache(async function readMascotData(user: MascotUserInput): Promise<MascotData> {
  const where = { ...feedWhere({ id: user.id, coupleId: user.coupleId }), locked: false };

  const [entries, photos, likes, comments, capsules, members, couple] = await Promise.all([
    prisma.entry.findMany({
      where,
      select: {
        content: true,
        mood: true,
        place: true,
      },
    }),
    prisma.attachment.count({ where: { type: "image", entry: where } }),
    prisma.reaction.count({ where: { entry: where } }),
    prisma.comment.count({ where: { entry: where } }),
    user.coupleId ? prisma.capsule.count({ where: { coupleId: user.coupleId } }) : Promise.resolve(0),
    user.coupleId
      ? prisma.user.findMany({
          where: { coupleId: user.coupleId },
          select: { points: true, bestStreak: true, lastActiveDay: true },
        })
      : Promise.resolve([{ points: user.points, bestStreak: user.bestStreak, lastActiveDay: user.lastActiveDay }]),
    user.coupleId
      ? prisma.couple.findUnique({ where: { id: user.coupleId }, select: { anniversary: true, mascotName: true } })
      : Promise.resolve(null),
  ]);

  let words = 0;
  const places = new Set<string>();
  const moodTally = new Map<string, number>();

  for (const e of entries) {
    const plain = toPlain(e.content);
    if (plain) words += plain.split(/\s+/).filter(Boolean).length;
    if (e.place) places.add(e.place);
    if (e.mood) moodTally.set(e.mood, (moodTally.get(e.mood) ?? 0) + 1);
  }

  const topMoodKey = [...moodTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const connectionPoints = members.reduce((s, m) => s + m.points, 0);

  // Atividade recente do casal: menor "dias desde o último registro" entre os dois.
  const daysSinceActive = coupleDaysSinceActive(members);

  const input: MascotInput = {
    level: levelFromPoints(connectionPoints),
    topMoodKey,
    streak: user.streak,
    bestStreak: Math.max(user.bestStreak, ...members.map((m) => m.bestStreak)),
    daysSinceActive,
    total: entries.length,
    words,
    photos,
    places: places.size,
    capsules,
    likes,
    comments,
    daysTogether: couple?.anniversary
      ? Math.floor((Date.now() - couple.anniversary.getTime()) / 86400000)
      : null,
  };

  return { state: mascotState(input), name: couple?.mascotName ?? null };
}, ["enlace-mascot-data-v2"], { revalidate: 120 });

/** Evita varrer textos, anexos, comentários e reações em toda navegação. Os
 * argumentos fazem parte da chave; atividade do próprio usuário invalida
 * naturalmente a leitura e dados do parceiro expiram em até dois minutos. */
export async function mascotData(user: MascotUserInput): Promise<MascotData> {
  return readMascotData(user);
}

/** Dias desde o registro mais recente de qualquer membro. */
function coupleDaysSinceActive(members: { lastActiveDay: string | null }[]): number {
  const today = startOfToday();
  let best = 999;
  for (const m of members) {
    if (!m.lastActiveDay) continue;
    const [y, mo, d] = m.lastActiveDay.split("-").map(Number);
    const day = new Date(y, (mo || 1) - 1, d || 1).getTime();
    const diff = Math.max(0, Math.round((today - day) / 86400000));
    if (diff < best) best = diff;
  }
  return best === 999 ? 30 : best;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
