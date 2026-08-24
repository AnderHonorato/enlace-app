"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/nucleo/cliente";
import { moodOf } from "@/nucleo/humores";
import { cn } from "@/nucleo/utilitarios";

type DayInfo = { count: number; mood: string | null };
type HeatmapData = {
  days: Record<string, DayInfo>;
  from: string;
  to: string;
  activeDays: number;
  maxCount: number;
};

type Cell = { key: string; date: Date; info: DayInfo | null; future: boolean };

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Mapa de calor do ano — uma célula por dia, colorida pelo humor daquele dia,
 * com a intensidade crescendo pela quantidade de memórias. Estilo "contribuições
 * do GitHub", mas emocional.
 */
export function YearHeatmap() {
  const reduced = useReducedMotion();
  const [data, setData] = useState<HeatmapData | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Cell | null>(null);

  useEffect(() => {
    api<HeatmapData>("/api/heatmap")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  // Constrói as colunas (semanas), começando no domingo <= (hoje - 52 semanas).
  const weeks = useMemo(() => {
    if (!data) return [] as Cell[][];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7); // ~1 ano
    start.setDate(start.getDate() - start.getDay()); // recua até domingo

    const cols: Cell[][] = [];
    const cursor = new Date(start);
    while (cursor <= today || cursor.getDay() !== 0) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const key = dayKey(date);
        const future = date > today;
        col.push({ key, date, info: future ? null : data.days[key] ?? null, future });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
      if (cursor > today && cursor.getDay() === 0) break;
    }
    return cols;
  }, [data]);

  // Rótulos de mês: mostra o mês na primeira semana em que ele aparece.
  const monthLabels = useMemo(() => {
    const out: { col: number; label: string }[] = [];
    let last = -1;
    weeks.forEach((col, i) => {
      const m = col[0].date.getMonth();
      if (m !== last) {
        out.push({ col: i, label: MESES[m] });
        last = m;
      }
    });
    return out;
  }, [weeks]);

  const total = useMemo(
    () => (data ? Object.values(data.days).reduce((s, d) => s + d.count, 0) : 0),
    [data]
  );

  if (error) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-xl text-text">O ano de vocês</h3>
        {data && (
          <span className="text-xs text-muted">
            {total} {total === 1 ? "memória" : "memórias"} · {data.activeDays} dias
          </span>
        )}
      </div>

      {!data ? (
        <div className="h-32 animate-pulse rounded-xl bg-surface2/50" />
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-full">
              {/* rótulos de mês */}
              <div className="relative mb-1 ml-6 h-4">
                {monthLabels.map((m) => (
                  <span
                    key={`${m.col}-${m.label}`}
                    className="absolute text-[10px] text-faint"
                    style={{ left: m.col * 15 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {/* dias da semana */}
                <div className="mr-1 flex w-5 flex-col gap-[3px]">
                  {WEEKDAYS.map((w, i) => (
                    <span key={i} className="flex h-3 items-center text-[9px] text-faint">
                      {i % 2 === 1 ? w : ""}
                    </span>
                  ))}
                </div>

                {/* colunas de semanas */}
                {weeks.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-[3px]">
                    {col.map((cell, ri) => (
                      <HeatCell
                        key={cell.key}
                        cell={cell}
                        maxCount={data.maxCount}
                        reduced={!!reduced}
                        delay={reduced ? 0 : (ci * 7 + ri) * 0.0012}
                        active={selected?.key === cell.key}
                        onSelect={() => cell.info && setSelected(cell)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* detalhe do dia selecionado */}
          <div className="mt-3 flex min-h-[1.5rem] items-center justify-between">
            <div className="text-xs text-muted">
              {selected && selected.info ? (
                <span>
                  <b className="text-text">{fmtDay(selected.date)}</b> ·{" "}
                  {selected.info.count} {selected.info.count === 1 ? "memória" : "memórias"}
                  {selected.info.mood && moodOf(selected.info.mood) && (
                    <> · {moodOf(selected.info.mood)!.emoji} {moodOf(selected.info.mood)!.label}</>
                  )}
                </span>
              ) : (
                <span className="text-faint">Toque num dia para ver o que rolou.</span>
              )}
            </div>
            {/* legenda de intensidade */}
            <div className="flex items-center gap-1 text-[10px] text-faint">
              menos
              <span className="flex gap-0.5">
                {[0.15, 0.35, 0.6, 1].map((o, i) => (
                  <span key={i} className="h-3 w-3 rounded-[3px] bg-accent" style={{ opacity: o }} />
                ))}
              </span>
              mais
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HeatCell({
  cell,
  maxCount,
  reduced,
  delay,
  active,
  onSelect,
}: {
  cell: Cell;
  maxCount: number;
  reduced: boolean;
  delay: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { info, future } = cell;
  // cor pelo humor do dia; intensidade pela quantidade
  const mood = info?.mood ? moodOf(info.mood) : null;
  const base = mood?.color ?? "rgb(var(--accent))";
  const intensity = info ? 0.28 + 0.72 * Math.min(1, info.count / maxCount) : 0;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={!info}
      title={info ? `${fmtDay(cell.date)} · ${info.count}` : ""}
      initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: future ? 0.25 : 1 }}
      transition={{ delay, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      whileHover={info ? { scale: 1.35, zIndex: 5 } : {}}
      className={cn(
        "h-3 w-3 rounded-[3px] transition-shadow",
        !info && "bg-surface2/70",
        active && "ring-2 ring-text ring-offset-1 ring-offset-surface"
      )}
      style={info ? { background: base, opacity: intensity } : undefined}
    />
  );
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
