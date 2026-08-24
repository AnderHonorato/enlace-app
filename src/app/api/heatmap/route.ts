import { prisma } from "@/nucleo/prisma";
import { requireUser, json, handle } from "@/nucleo/api";
import { feedWhere } from "@/nucleo/memorias";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Mapa de calor do ano: para cada dia dos últimos ~12 meses, quantas memórias
 * houve e qual foi o humor dominante. O front desenha a grade colorida.
 */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 370);
    from.setHours(0, 0, 0, 0);

    const entries = await prisma.entry.findMany({
      where: { ...feedWhere({ id: user.id, coupleId: user.coupleId }), entryDate: { gte: from, lte: to } },
      select: { entryDate: true, mood: true },
    });

    // Agrupa por dia: contagem + tally de humores.
    const byDay = new Map<string, { count: number; moods: Map<string, number> }>();
    for (const e of entries) {
      const k = dayKey(e.entryDate);
      const cur = byDay.get(k) ?? { count: 0, moods: new Map() };
      cur.count++;
      if (e.mood) cur.moods.set(e.mood, (cur.moods.get(e.mood) ?? 0) + 1);
      byDay.set(k, cur);
    }

    const days: Record<string, { count: number; mood: string | null }> = {};
    for (const [k, v] of byDay) {
      const mood = [...v.moods.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      days[k] = { count: v.count, mood };
    }

    // Estatísticas resumidas.
    const activeDays = Object.keys(days).length;
    const maxCount = Math.max(1, ...Object.values(days).map((d) => d.count));

    return json({ days, from: dayKey(from), to: dayKey(to), activeDays, maxCount });
  });
}
