"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Mission } from "@/nucleo/desafios";
import { KIND_LABEL } from "@/nucleo/desafios";
import { cn } from "@/nucleo/utilitarios";
import { listItem, spring } from "@/nucleo/movimento";

const LEVEL_COLOR: Record<Mission["level"], string> = {
  leve: "rgb(var(--success))",
  média: "rgb(var(--warning))",
  ousada: "rgb(var(--accent))",
};

/**
 * Missões do dia. Ficam recolhidas por padrão para não competir com o feed —
 * a ideia é oferecer "o que fazer hoje" sem virar mais uma parede de cards.
 */
export function DailyMissions({
  missions,
  doneTags = [],
}: {
  missions: Mission[];
  /** Tags já usadas nesta semana — usadas para marcar missão cumprida. */
  doneTags?: string[];
}) {
  const [open, setOpen] = useState(false);
  const done = (mm: Mission) => !!mm.tag && doneTags.includes(mm.tag.toLowerCase());
  const doneCount = missions.filter(done).length;

  return (
    <div className="scrap-frame scrap-frame-quiet mb-5 overflow-hidden rounded-3xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface2/50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-xl">
          🎯
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl text-text">Missões de hoje</div>
          <div className="text-sm text-muted">
            {doneCount > 0
              ? `${doneCount} de ${missions.length} concluída${doneCount > 1 ? "s" : ""} — bora fechar o resto?`
              : `${missions.length} ideias pequenas para hoje.`}
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-faint">
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="space-y-2 p-3">
              {missions.map((mm, i) => {
                const isDone = done(mm);
                return (
                  <motion.div
                    key={mm.id}
                    variants={listItem}
                    initial="hidden"
                    animate="show"
                    custom={i}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3 transition",
                      isDone ? "border-success/40 bg-success/8" : "border-border bg-bg2"
                    )}
                  >
                    <span className="mt-0.5 shrink-0 text-xl">{mm.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isDone ? "text-success line-through" : "text-text"
                          )}
                        >
                          {mm.title}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: `${LEVEL_COLOR[mm.level]}22`, color: LEVEL_COLOR[mm.level] }}
                        >
                          {mm.level}
                        </span>
                        <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-faint">
                          {KIND_LABEL[mm.kind]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{mm.desc}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-accent">+{mm.points} pts</span>
                        {!isDone && (
                          <Link
                            href={
                              `/app/novo?missao=${encodeURIComponent(mm.title)}` +
                              (mm.tag ? `&tag=${encodeURIComponent(mm.tag)}` : "")
                            }
                            className="text-[11px] font-medium text-muted underline-offset-2 transition hover:text-accent hover:underline"
                          >
                            fazer agora
                          </Link>
                        )}
                      </div>
                    </div>
                    {isDone && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={spring.bouncy}
                        className="shrink-0 text-success"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}

              <Link
                href="/app/trofeus"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-2.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-accent"
              >
                🏆 Ver o Hall de Troféus
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
