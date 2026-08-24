"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevron } from "../IconesRetrospectiva";
import { moonPhase, seasonOf, constellationOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";
import { EASE_OUT, spring } from "@/nucleo/movimento";



export type RetroAppStats = {
  chatMessages: number;
  chatMedia: { images: number; audios: number; videos: number; files: number };
  tasksCreated: number;
  tasksDone: number;
  wishesCreated: number;
  wishesDone: number;
  goalsCreated: number;
  goalsDone: number;
  gamesPlayed: number;
  gamePoints: number;
  favoriteGame: string | null;
  capsules: number;
  surprises: number;
};

const GAME_NAMES: Record<string, string> = {
  tictactoe: "Jogo da velha",
  verdade: "Verdade",
  complete: "Complete a frase",
  filmeemoji: "Filme por emoji",
  memoria: "Memória",
  desenho: "Rabisca",
  rabisca: "Rabisca",
};

/** Cartões de papel que resumem os módulos usados, sem expor conteúdo privado. */
export function AppPulseScene({ stats }: { stats: RetroAppStats }) {
  const cards = [
    stats.chatMessages > 0 && { emoji: "💬", value: stats.chatMessages, label: "mensagens" },
    stats.gamesPlayed > 0 && { emoji: "🎮", value: stats.gamesPlayed, label: "jogos registrados" },
    stats.tasksDone > 0 && { emoji: "✓", value: stats.tasksDone, label: "tarefas feitas" },
    stats.wishesDone + stats.goalsDone > 0 && { emoji: "✦", value: stats.wishesDone + stats.goalsDone, label: "planos realizados" },
    stats.capsules > 0 && { emoji: "💌", value: stats.capsules, label: "cápsulas" },
    stats.surprises > 0 && { emoji: "🎁", value: stats.surprises, label: "surpresas" },
  ].filter(Boolean).slice(0, 6) as { emoji: string; value: number; label: string }[];

  return (
    <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 24, rotate: index % 2 ? 2 : -2 }}
          animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
          transition={{ ...spring.soft, delay: 0.18 + index * 0.1 }}
          className="retro-stat-note relative flex min-h-28 flex-col justify-between rounded-sm border border-white/20 bg-white/90 p-3 text-left text-[#302c27] shadow-xl"
        >
          <span className="text-xl" aria-hidden>{card.emoji}</span>
          <span>
            <strong className="block font-display text-3xl leading-none text-[#a32e4c]">{card.value.toLocaleString("pt-BR")}</strong>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#57503f]">{card.label}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ProgressNote({ label, done, total, delay }: { label: string; done: number; total: number; delay: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring.soft, delay }}
      className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-white">{label}</span>
        <span className="text-sm tabular-nums text-white/70">{done}/{total}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
        <motion.div
          className="h-full rounded-full bg-[#ed9ab1]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: delay + 0.12 }}
        />
      </div>
    </motion.div>
  );
}

/** Progresso atual dos planos criados no período, sem fingir data de conclusão. */
export function PlansScene({ stats }: { stats: RetroAppStats }) {
  return (
    <div className="mt-5 w-full max-w-sm space-y-3">
      {stats.tasksCreated > 0 && <ProgressNote label="Tarefas" done={stats.tasksDone} total={stats.tasksCreated} delay={0.18} />}
      {stats.wishesCreated > 0 && <ProgressNote label="Lista de desejos" done={stats.wishesDone} total={stats.wishesCreated} delay={0.3} />}
      {stats.goalsCreated > 0 && <ProgressNote label="Metas" done={stats.goalsDone} total={stats.goalsCreated} delay={0.42} />}
      <p className="pt-1 text-center text-xs leading-relaxed text-white/60">Situação atual dos itens criados neste período.</p>
    </div>
  );
}

export function GamesScene({ stats }: { stats: RetroAppStats }) {
  return (
    <div className="mt-5 w-full max-w-sm rounded-[2rem] border border-white/20 bg-black/20 p-5 text-left backdrop-blur">
      <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.bouncy}>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">placar da diversão</span>
        <div className="mt-2 flex items-end justify-between gap-4">
          <strong className="font-display text-6xl leading-none text-white">{stats.gamePoints.toLocaleString("pt-BR")}</strong>
          <span className="pb-1 text-sm text-white/70">pontos nos jogos</span>
        </div>
      </motion.div>
      {stats.favoriteGame && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-5 border-t border-white/15 pt-4"
        >
          <span className="text-xs text-white/55">O jogo que mais apareceu</span>
          <p className="mt-1 font-display text-2xl text-[#ed9ab1]">{GAME_NAMES[stats.favoriteGame] ?? stats.favoriteGame}</p>
        </motion.div>
      )}
    </div>
  );
}
