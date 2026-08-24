"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Mascote } from "./Mascote";
import type { MascotState } from "@/nucleo/mascote";

/** Card compacto do bichinho na home — leva para a página completa. */
export function MascotCard({ state, name }: { state: MascotState; name: string | null }) {
  const displayName = name || "Seu bichinho";
  return (
    <Link href="/app/bichinho">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="mb-5 flex items-center gap-3 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/8 to-accent2/5 p-3 pr-4 transition"
      >
        <div className="shrink-0">
          <Mascote state={state} size={64} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xl text-text">{displayName}</span>
            <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              {state.stageName}
            </span>
          </div>
          <div className="text-sm text-muted">
            {state.daysSinceActive === 0
              ? `Está ${state.moodLabel} — vocês cuidaram dele hoje.`
              : state.daysSinceActive >= 7
              ? "Está com saudade… registrem algo para animá-lo."
              : `Está ${state.moodLabel}. Registrem algo para ele crescer.`}
          </div>
          {/* mini barra de evolução */}
          {state.toNext && (
            <div className="mt-1.5 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full accent-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress * 100}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </div>
        <ChevronRight size={18} className="shrink-0 text-faint" />
      </motion.div>
    </Link>
  );
}
