"use client";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { moodOf } from "@/nucleo/humores";

export type MoodPoint = { date: string; mood: string | null };

/** Distribuição de humores + faixa dos últimos 30 dias. */
export function MoodChart({ points }: { points: MoodPoint[] }) {
  const withMood = points.filter((p) => p.mood);
  if (withMood.length === 0) return null;

  // Contagem por humor (maiores primeiro)
  const tally = new Map<string, number>();
  for (const p of withMood) tally.set(p.mood!, (tally.get(p.mood!) ?? 0) + 1);
  const rows = [...tally.entries()]
    .map(([key, count]) => ({ mood: moodOf(key), count }))
    .filter((r) => r.mood)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const max = Math.max(...rows.map((r) => r.count));

  // Últimos 30 dias, um quadradinho por dia
  const days: { key: string; mood: ReturnType<typeof moodOf> }[] = [];
  const byDay = new Map<string, string>();
  for (const p of withMood) {
    const d = new Date(p.date);
    byDay.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, p.mood!);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.push({ key: k, mood: moodOf(byDay.get(k) ?? null) });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <BarChart3 size={18} />
        </span>
        <h2 className="font-display text-2xl text-text">Humor de vocês</h2>
      </div>

      {/* Barras por humor */}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.mood!.key} className="flex items-center gap-2.5">
            <span className="w-6 shrink-0 text-center text-lg">{r.mood!.emoji}</span>
            <span className="w-24 shrink-0 truncate text-xs text-muted">{r.mood!.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.mood!.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.count / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-medium text-faint">{r.count}</span>
          </div>
        ))}
      </div>

      {/* Faixa dos últimos 30 dias */}
      <div className="mt-5">
        <div className="mb-1.5 text-xs font-medium text-faint">Últimos 30 dias</div>
        <div className="flex gap-[3px]">
          {days.map((d, i) => (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.012 }}
              title={d.mood ? d.mood.label : "sem registro"}
              className="h-6 flex-1 rounded-[3px]"
              style={{ background: d.mood ? d.mood.color : "rgb(var(--surface-2))" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
