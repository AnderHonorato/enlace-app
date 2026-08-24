"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_COLOR, TIER_LABEL, type Tier, type TrophyDTO } from "@/nucleo/conquistas";
import { cn } from "@/nucleo/utilitarios";
import { listItem, spring } from "@/nucleo/movimento";

type Group = TrophyDTO["group"];

const GROUP_LABEL: Record<Group, string> = {
  memórias: "Memórias",
  escrita: "Escrita",
  fotos: "Fotos e lugares",
  carinho: "Carinho",
  constância: "Constância",
  dupla: "A dupla",
  tempo: "Tempo juntos",
  extras: "Extras",
};

export function TrophyHall({
  trophies,
  summary,
}: {
  trophies: TrophyDTO[];
  summary: { unlocked: number; total: number; byTier: Record<Tier, number> };
}) {
  const [filter, setFilter] = useState<"todos" | "conquistados" | "faltando">("todos");

  const shown = useMemo(() => {
    if (filter === "conquistados") return trophies.filter((t) => t.unlocked);
    if (filter === "faltando") return trophies.filter((t) => !t.unlocked);
    return trophies;
  }, [trophies, filter]);

  const grouped = useMemo(() => {
    const map = new Map<Group, TrophyDTO[]>();
    for (const t of shown) {
      const g = t.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    return [...map.entries()];
  }, [shown]);

  const pct = summary.total > 0 ? summary.unlocked / summary.total : 0;

  return (
    <div>
      {/* Cabeçalho: quanto do hall já está preenchido */}
      <div className="mb-6">
        <div className="kicker mb-1">Conquistas de vocês</div>
        <h1 className="font-display text-4xl text-text">
          Hall de <span className="gradient-text">Troféus</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {summary.unlocked} de {summary.total} conquistados. O resto está esperando vocês.
        </p>

        {/* barra geral */}
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface2">
          <motion.div
            className="h-full rounded-full accent-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* medalhas por raridade */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(["lenda", "ouro", "prata", "bronze"] as Tier[]).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{ borderColor: `${TIER_COLOR[t]}66`, color: TIER_COLOR[t] }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: TIER_COLOR[t] }} />
              {TIER_LABEL[t]} · {summary.byTier[t]}
            </span>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex gap-1.5">
        {(["todos", "conquistados", "faltando"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
              filter === f
                ? "border-accent bg-accent/12 text-accent"
                : "border-border bg-surface text-muted hover:bg-surface2"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-muted">
          Nada aqui com esse filtro.
        </p>
      ) : (
        <div className="space-y-7">
          {grouped.map(([group, list]) => (
            <section key={group}>
              <h2 className="kicker mb-2.5 flex items-center gap-2">
                {GROUP_LABEL[group]}
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs normal-case tracking-normal">
                  {list.filter((t) => t.unlocked).length}/{list.length}
                </span>
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <AnimatePresence initial={false}>
                  {list.map((t, i) => (
                    <TrophyCard key={t.key} t={t} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TrophyCard({ t, index }: { t: TrophyDTO; index: number }) {
  const color = TIER_COLOR[t.tier];
  const locked = !t.unlocked;

  return (
    <motion.div
      layout
      variants={listItem}
      initial="hidden"
      animate="show"
      exit="exit"
      custom={index}
      whileHover={{ y: -2 }}
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 transition",
        locked ? "border-border bg-surface" : "border-transparent bg-surface"
      )}
      style={locked ? undefined : { borderColor: `${color}55`, boxShadow: `0 0 0 1px ${color}22` }}
    >
      {/* medalha */}
      <div
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
          locked && "grayscale"
        )}
        style={{
          background: locked ? "rgb(var(--surface2))" : `${color}26`,
          boxShadow: locked ? undefined : `0 0 16px ${color}44`,
          opacity: locked ? 0.55 : 1,
        }}
      >
        {t.emoji}
        {t.unlocked && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-xl"
            style={{ border: `1.5px solid ${color}` }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.2 }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate text-sm font-semibold", locked ? "text-muted" : "text-text")}>
            {t.title}
          </span>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${color}22`, color }}
          >
            {TIER_LABEL[t.tier]}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.desc}</p>

        {/* progresso só para os que faltam — nos conquistados vira ruído */}
        {locked && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${t.pct * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 + index * 0.03, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-faint">
              {t.current.toLocaleString("pt-BR")}/{t.goal.toLocaleString("pt-BR")}
            </span>
          </div>
        )}
      </div>

      {t.unlocked && (
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.1 + index * 0.04 }}
          className="shrink-0 text-lg"
          style={{ color }}
          title="Conquistado"
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
}
