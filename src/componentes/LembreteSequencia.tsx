"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, PenLine, Check, ShieldCheck } from "lucide-react";
import { IconCerto } from "./Icones";

export type StreakInfo = {
  streak: number;
  activeToday: boolean;
  atRisk: boolean;
  weekCount: number;
  weekGoal: number;
  /** Escudos que protegem a sequência (perdoam 1 dia faltado). */
  shields?: number;
  /** A sequência está protegida por um escudo agora. */
  protected?: boolean;
};

export function StreakReminder({ info }: { info: StreakInfo }) {
  const { streak, activeToday, weekCount, weekGoal, shields = 0, protected: prot = false } = info;
  const weekRatio = Math.min(1, weekCount / weekGoal);

  let title: string;
  let sub: string;
  if (activeToday) {
    title = streak > 1 ? `🔥 ${streak} dias seguidos!` : "Registrado hoje 💜";
    sub = "Você já cuidou da sua sequência hoje. Continue assim!";
  } else if (streak > 0) {
    title = `Sua sequência: ${streak} ${streak === 1 ? "dia" : "dias"}`;
    sub = prot
      ? "Você ainda não registrou hoje, mas um escudo protege sua sequência se faltar."
      : "Você ainda não registrou nada hoje — não perca a sequência (e os pontos).";
  } else {
    title = "Comece uma sequência hoje";
    sub = "Escreva algo todo dia. Faltar um dia custa pontos — mas o escudo perdoa uma falha.";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      <div className="card p-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              activeToday ? "bg-success/15 text-success" : "bg-accent/12 text-accent"
            }`}
          >
            <Flame size={26} className={activeToday ? "" : streak > 0 ? "" : "opacity-70"} />
            {streak > 0 && (
              <span className="absolute -bottom-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {streak}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-text">{title}</div>
            <div className="text-sm text-muted">{sub}</div>
          </div>

          {!activeToday && (
            <Link
              href="/app/novo"
              className="flex shrink-0 items-center gap-1.5 rounded-xl accent-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              <PenLine size={15} /> Hoje
            </Link>
          )}
          {activeToday && <Check size={22} className="shrink-0 text-success" />}
        </div>

        {/* Escudos de sequência */}
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-border bg-bg2/50 px-3 py-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              shields > 0 ? "bg-accent/12 text-accent" : "bg-surface2 text-faint"
            }`}
          >
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-text">
                {shields > 0 ? `${shields} escudo${shields > 1 ? "s" : ""}` : "Sem escudo"}
              </span>
              {/* medalhas de escudo, estilo "vidas" */}
              <span className="flex gap-0.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`text-xs ${i < shields ? "opacity-100" : "opacity-25 grayscale"}`}
                  >
                    🛡️
                  </motion.span>
                ))}
              </span>
            </div>
            <div className="text-xs text-muted">
              {shields > 0
                ? "Perdoa 1 dia faltado. Você ganha 1 escudo por mês."
                : "Você ganha um novo escudo no começo do próximo mês."}
            </div>
          </div>
        </div>

        {/* Meta semanal */}
        <div className="mt-3.5">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">Meta da semana</span>
            <span className={weekCount >= weekGoal ? "font-semibold text-success" : "text-faint"}>
              {Math.min(weekCount, weekGoal)}/{weekGoal}{" "}
              {weekCount >= weekGoal && (
                <span className="inline-block align-[-2px]">
                  <IconCerto size={13} />
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className={`h-full rounded-full ${weekCount >= weekGoal ? "bg-success" : "accent-gradient"}`}
              style={{ width: `${weekRatio * 100}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
