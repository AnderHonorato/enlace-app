"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Lock, CheckCircle2, Star, Coins, Award, Eye, Sparkles } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, duration, EASE_OUT } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";
import { useState, useEffect, useRef } from "react";

interface Phase {
  id: number;
  title: string;
  description: string;
  emoji: string;
  requiredXP: number;
  reward: string;
  rewardType: "coin" | "achievement" | "secret" | "none";
  achievementKey?: string;
  coinAmount?: number;
  secretMessage?: string;
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: "Primeiro Encontro",
    description: "Reviva a magia do primeiro encontro",
    emoji: "🌸",
    requiredXP: 0,
    reward: "Nenhuma recompensa",
    rewardType: "none",
  },
  {
    id: 2,
    title: "Primeiras Memórias",
    description: "Construa memórias inesquecíveis juntos",
    emoji: "📸",
    requiredXP: 200,
    reward: "50 moedas",
    rewardType: "coin",
    coinAmount: 50,
  },
  {
    id: 3,
    title: "Quem Conhece Quem",
    description: "Descubram o quanto se conhecem",
    emoji: "🧠",
    requiredXP: 500,
    reward: "Conquista “💘 Conexão”",
    rewardType: "achievement",
    achievementKey: "💘 Conexão",
  },
  {
    id: 4,
    title: "Desafios",
    description: "Superem provas que fortalecem o amor",
    emoji: "🎯",
    requiredXP: 1000,
    reward: "100 moedas",
    rewardType: "coin",
    coinAmount: 100,
  },
  {
    id: 5,
    title: "Batalha do Casal",
    description: "Unam forças para vencer desafios épicos",
    emoji: "⚔️",
    requiredXP: 2000,
    reward: "Conquista “⚔️ Guerreiros”",
    rewardType: "achievement",
    achievementKey: "⚔️ Guerreiros",
  },
  {
    id: 6,
    title: "Final Secreto",
    description: "A prova definitiva do seu relacionamento",
    emoji: "🔑",
    requiredXP: 5000,
    reward: "Conquista “👑 Lenda do Relacionamento”",
    rewardType: "secret",
    achievementKey: "👑 Lenda do Relacionamento",
    secretMessage:
      "Vocês chegaram ao fim da jornada. Mas todo fim é só um novo começo. O amor verdadeiro não tem fases — ele é o próprio jogo. E vocês venceram.",
  },
];

// Persistimos só quais fases já foram "resgatadas" (clicaram em Revelar recompensa).
// O XP em si já é salvo pelo GameXP — mas sem isto, ao recarregar a página o card
// voltava a mostrar "Revelar recompensa" e dava pra clicar de novo, duplicando moedas.
const STORAGE_KEY = "enlace-campanha";

function loadClaimed(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((n) => typeof n === "number");
    return [];
  } catch {
    return [];
  }
}

function saveClaimed(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

interface PhaseCardProps {
  phase: Phase;
  status: "locked" | "current" | "completed" | "unlocked";
  onUnlockReward: (phase: Phase) => void;
  celebrating: boolean;
  justUnlocked: boolean;
  reduceMotion: boolean;
}

function PhaseCard({ phase, status, onUnlockReward, celebrating, justUnlocked, reduceMotion }: PhaseCardProps) {
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isUnlocked = status === "unlocked";
  const isFinal = phase.id === 6;
  const isGold = isFinal && isUnlocked;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={
        justUnlocked && !reduceMotion
          ? { opacity: 1, x: 0, scale: [1, 1.03, 1] }
          : { opacity: 1, x: 0 }
      }
      transition={{ ...spring.snappy, delay: phase.id * 0.08 }}
      className={cn(
        "relative flex gap-4 rounded-2xl border p-5 transition-all duration-300",
        isGold && "border-gold/50 bg-gradient-to-br from-gold/15 to-surface shadow-lift",
        !isGold && isCompleted && "border-success/30 bg-surface",
        !isGold && isCurrent && "border-accent/40 bg-surface shadow-lift",
        !isGold && isUnlocked && "border-border bg-surface",
        isLocked && "border-border bg-surface opacity-50"
      )}
    >
      {isCurrent && !reduceMotion && (
        <span className="absolute -inset-0.5 rounded-2xl bg-accent/10 animate-pulse pointer-events-none" />
      )}
      {justUnlocked && !reduceMotion && (
        <motion.span
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
          className="absolute -inset-1 rounded-3xl bg-gold/25 pointer-events-none"
        />
      )}

      <div
        className={cn(
          "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl",
          isGold && "bg-gold/20",
          isCompleted && "bg-success/20",
          isCurrent && "bg-accent/20",
          isLocked && "bg-border/40"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 size={22} className="text-success" />
        ) : isLocked ? (
          <Lock size={18} className="text-muted" />
        ) : isUnlocked && isGold ? (
          <Star size={22} className="text-gold" />
        ) : (
          <span>{phase.emoji}</span>
        )}
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={cn(
              "font-display text-lg",
              isGold && "text-gold",
              isCompleted && "text-success",
              isCurrent && "text-accent",
              isLocked && "text-muted"
            )}
          >
            {phase.title}
          </h3>
          {isCurrent && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
              Atual
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success uppercase tracking-wider">
              Completa
            </span>
          )}
          {justUnlocked && !isCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold uppercase tracking-wider"
            >
              <Sparkles size={10} /> Nova fase!
            </motion.span>
          )}
        </div>

        <p className={cn("mt-1 text-sm", isLocked ? "text-faint" : "text-muted")}>
          {phase.description}
        </p>

        <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
          <span className={cn(isLocked ? "text-faint" : "text-muted")}>
            {phase.requiredXP.toLocaleString()} XP necessários
          </span>

          {phase.rewardType !== "none" && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                isCompleted && "text-success",
                isGold && "text-gold",
                !isCompleted && !isGold && "text-gold/70"
              )}
            >
              {phase.rewardType === "coin" && <Coins size={14} />}
              {phase.rewardType === "achievement" && <Award size={14} />}
              {phase.rewardType === "secret" && <Star size={14} />}
              {phase.reward}
            </span>
          )}
        </div>

        {isFinal && isUnlocked && phase.secretMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={spring.soft}
            className="mt-3 overflow-hidden rounded-xl border border-gold/30 bg-gold/10 p-4"
          >
            <p className="text-sm leading-relaxed text-gold/90 italic">
              &ldquo;{phase.secretMessage}&rdquo;
            </p>
          </motion.div>
        )}

        {isUnlocked && !isCompleted && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onUnlockReward(phase)}
            className={cn(
              "mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition",
              isGold
                ? "bg-gold/20 text-gold hover:bg-gold/30"
                : "bg-accent/20 text-accent hover:bg-accent/30"
            )}
          >
            <Eye size={13} />
            Revelar recompensa
          </motion.button>
        )}

        <AnimatePresence>
          {celebrating && !reduceMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <motion.span
                  key={i}
                  className="absolute top-1/2 left-1/2 text-lg"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{
                    x: Math.cos((i / 10) * Math.PI * 2) * 90,
                    y: Math.sin((i / 10) * Math.PI * 2) * 70,
                    opacity: 0,
                    scale: 1,
                  }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                >
                  {["✨", "🎉", "💛"][i % 3]}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function CampanhaModo() {
  const { xp, coins, achievements, addCoins, unlockAchievement, addXP, markPlayed } = useGameXP();
  const reduceMotion = !!useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [claimed, setClaimed] = useState<Set<number>>(new Set());
  const [celebratingId, setCelebratingId] = useState<number | null>(null);
  const [justUnlockedIds, setJustUnlockedIds] = useState<Set<number>>(new Set());
  const seenUnlocked = useRef<Set<number> | null>(null);

  // Carrega as fases já resgatadas assim que o componente monta.
  useEffect(() => {
    setClaimed(new Set(loadClaimed()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveClaimed(Array.from(claimed));
  }, [hydrated, claimed]);

  const nextPhaseIndex = PHASES.findIndex((p) => p.requiredXP > xp);
  const currentPhaseId = nextPhaseIndex === -1 ? PHASES.length : nextPhaseIndex;

  const currentlyUnlockedIds = PHASES.filter((p) => p.requiredXP <= xp).map((p) => p.id);

  // Detecta quando uma fase acaba de cruzar o limite de XP e liga a animação de
  // "fase nova" por alguns segundos — sem isso, desbloquear uma fase era silencioso.
  useEffect(() => {
    if (!hydrated) return;
    if (seenUnlocked.current === null) {
      // Primeira vez que carregamos: tudo que já está desbloqueado é "antigo", não novo.
      seenUnlocked.current = new Set(currentlyUnlockedIds);
      return;
    }
    const fresh = currentlyUnlockedIds.filter((id) => !seenUnlocked.current!.has(id));
    if (fresh.length > 0) {
      seenUnlocked.current = new Set([...seenUnlocked.current, ...fresh]);
      setJustUnlockedIds((prev) => new Set([...prev, ...fresh]));
      const timer = setTimeout(() => {
        setJustUnlockedIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, xp]);

  const nextPhaseRequired =
    currentPhaseId < PHASES.length ? PHASES[currentPhaseId].requiredXP : PHASES[PHASES.length - 1].requiredXP;

  const prevPhaseRequired =
    currentPhaseId > 0 ? PHASES[currentPhaseId - 1].requiredXP : 0;

  const progressInPhase = nextPhaseRequired > prevPhaseRequired
    ? Math.min(100, Math.max(0, ((xp - prevPhaseRequired) / (nextPhaseRequired - prevPhaseRequired)) * 100))
    : 100;

  function getPhaseStatus(phase: Phase): "locked" | "current" | "completed" | "unlocked" {
    if (claimed.has(phase.id)) return "completed";
    if (phase.requiredXP <= xp) return "unlocked";
    if (phase.id === currentPhaseId) return "current";
    return "locked";
  }

  function handleUnlockReward(phase: Phase) {
    markPlayed();
    if (phase.rewardType === "coin" && phase.coinAmount) {
      addCoins(phase.coinAmount);
    }
    if (phase.rewardType === "achievement" && phase.achievementKey) {
      unlockAchievement(phase.achievementKey);
    }
    if (phase.rewardType === "secret" && phase.achievementKey) {
      unlockAchievement(phase.achievementKey);
      addXP(200);
    }
    setClaimed((prev) => new Set(prev).add(phase.id));
    setCelebratingId(phase.id);
    setTimeout(() => setCelebratingId((cur) => (cur === phase.id ? null : cur)), 900);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-text">
          Campanha do <span className="gradient-text">Amor</span>
        </h2>
        <p className="mt-1 text-sm text-muted">Complete as fases e desbloqueie recompensas</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted">Progresso total</span>
          <span className="text-sm font-semibold text-text">
            {xp.toLocaleString()} <span className="text-muted">/ {5000} XP</span>
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (xp / 5000) * 100)}%` }}
            transition={spring.soft}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted">
            <Award size={14} className="text-gold" />
            {achievements.length} conquistas
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Coins size={14} className="text-gold" />
            {coins} moedas
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Star size={14} className="text-gold" />
            Fase {Math.min(currentPhaseId, PHASES.length)}/{PHASES.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase) => {
          const status = getPhaseStatus(phase);
          return (
            <PhaseCard
              key={phase.id}
              phase={phase}
              status={status}
              onUnlockReward={handleUnlockReward}
              celebrating={celebratingId === phase.id}
              justUnlocked={justUnlockedIds.has(phase.id) && status !== "locked"}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </div>
    </div>
  );
}
