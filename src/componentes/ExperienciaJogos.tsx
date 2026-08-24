"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "./Avisos";
import { spring, EASE_OUT } from "@/nucleo/movimento";

interface GameXPState {
  xp: number;
  coins: number;
  achievements: string[];
  streak: number;
  lastPlayed: string;
}

interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
}

interface GameXPContextType extends GameXPState, LevelInfo {
  /** `game` é opcional só para não quebrar quem já chamava com um argumento. */
  addXP: (amount: number, game?: string) => void;
  addCoins: (amount: number) => void;
  unlockAchievement: (key: string) => void;
  markPlayed: () => void;
}

const STORAGE_KEY = "game-xp-data";

const DEFAULT_STATE: GameXPState = {
  xp: 0,
  coins: 0,
  achievements: [],
  streak: 0,
  lastPlayed: "",
};

// Curva de progressão: cada nível pede um pouco mais XP que o anterior,
// pra dar um ritmo de "sobe rápido no começo, segura um pouco depois".
const LEVEL_BASE_XP = 60;
const LEVEL_STEP_XP = 25;

function xpNeededForLevel(level: number) {
  return LEVEL_BASE_XP + (level - 1) * LEVEL_STEP_XP;
}

/** Converte XP acumulado em nível atual + progresso dentro do nível. */
export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, xp);
  let needed = xpNeededForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpNeededForLevel(level);
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
    progress: needed > 0 ? remaining / needed : 0,
  };
}

function loadState(): GameXPState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as GameXPState;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: GameXPState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak(prevStreak: number, prevLastPlayed: string): { streak: number; lastPlayed: string } {
  const today = todayString();
  if (prevLastPlayed === today) {
    return { streak: prevStreak, lastPlayed: today };
  }
  const prev = new Date(prevLastPlayed + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffDays = Math.round((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return { streak: prevStreak + 1, lastPlayed: today };
  }
  return { streak: 1, lastPlayed: today };
}

type GainEvent = {
  id: number;
  amount: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  leveledUp: boolean;
};

const GameXPContext = createContext<GameXPContextType | null>(null);

export function GameXPProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameXPState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [gains, setGains] = useState<GainEvent[]>([]);
  const prevXpRef = useRef<number | null>(null);
  const gainSeq = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  // Dispara o feedback visual (balão de XP + barra de nível) sempre que o
  // XP total sobe — reage ao estado em vez de acoplar isso ao addXP, então
  // funciona mesmo se o XP mudar por qualquer outro caminho no futuro.
  useEffect(() => {
    if (!hydrated) return;
    if (prevXpRef.current === null) {
      prevXpRef.current = state.xp;
      return;
    }
    const prevXp = prevXpRef.current;
    const diff = state.xp - prevXp;
    prevXpRef.current = state.xp;
    if (diff <= 0) return;

    const before = levelInfo(prevXp);
    const after = levelInfo(state.xp);
    const id = ++gainSeq.current;
    setGains((g) => [...g.slice(-2), { id, amount: diff, leveledUp: after.level > before.level, ...after }]);
    const timer = setTimeout(() => {
      setGains((g) => g.filter((x) => x.id !== id));
    }, 2400);
    return () => clearTimeout(timer);
  }, [state.xp, hydrated]);

  /**
   * Registra os pontos.
   *
   * O localStorage continua sendo atualizado na hora (o feedback é imediato e
   * funciona offline), mas a fonte de verdade do placar é o servidor: é o que
   * faz a pontuação não resetar ao trocar de aparelho e o que permite comparar
   * com a outra pessoa. Se a gravação falhar, o jogo não pode parar — por isso
   * o erro é engolido de propósito.
   */
  const addXP = useCallback((amount: number, game = "jogo") => {
    setState((prev) => ({ ...prev, xp: prev.xp + amount }));
    toast(`+${amount} XP`, "success");
    fetch("/api/pontuacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, points: amount }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const addCoins = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, coins: prev.coins + amount }));
    toast(`+${amount} moedas`, "success");
  }, []);

  const unlockAchievement = useCallback((key: string) => {
    setState((prev) => {
      if (prev.achievements.includes(key)) return prev;
      const updated = { ...prev, achievements: [...prev.achievements, key] };
      return updated;
    });
    toast(`Conquista: ${key}`, "info");
  }, []);

  const markPlayed = useCallback(() => {
    setState((prev) => {
      const { streak, lastPlayed } = updateStreak(prev.streak, prev.lastPlayed);
      return { ...prev, streak, lastPlayed };
    });
  }, []);

  const info = useMemo(() => levelInfo(state.xp), [state.xp]);

  const value: GameXPContextType = {
    xp: state.xp,
    coins: state.coins,
    achievements: state.achievements,
    streak: state.streak,
    lastPlayed: state.lastPlayed,
    ...info,
    addXP,
    addCoins,
    unlockAchievement,
    markPlayed,
  };

  return (
    <GameXPContext.Provider value={value}>
      {children}
      <GameXPOverlay gains={gains} reduceMotion={!!reduceMotion} />
    </GameXPContext.Provider>
  );
}

export function useGameXP() {
  const ctx = useContext(GameXPContext);
  if (!ctx) {
    throw new Error("useGameXP must be used within a GameXPProvider");
  }
  return ctx;
}

/** Conta de 0 até `target` em vez de pular direto — o "contador animado". */
function useAnimatedNumber(target: number, reduceMotion: boolean) {
  const [display, setDisplay] = useState(reduceMotion ? target : 0);
  useEffect(() => {
    if (reduceMotion) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const durationMs = 500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduceMotion]);
  return display;
}

/**
 * Notificação flutuante de ganho de XP: número que conta pra cima e uma
 * barrinha de progresso até o próximo nível. Fica no canto superior direito
 * pra não brigar com os toasts genéricos (que ficam embaixo).
 */
function GameXPOverlay({ gains, reduceMotion }: { gains: GainEvent[]; reduceMotion: boolean }) {
  if (gains.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[120] flex flex-col items-end gap-2 sm:right-5 sm:top-5">
      <AnimatePresence>
        {gains.map((g) => (
          <GainCard key={g.id} gain={g} reduceMotion={reduceMotion} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function GainCard({ gain, reduceMotion }: { gain: GainEvent; reduceMotion: boolean }) {
  const displayAmount = useAnimatedNumber(gain.amount, reduceMotion);

  return (
    <motion.div
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.9 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.92 }}
      transition={spring.bouncy}
      className="w-[178px] rounded-2xl border border-border bg-surface p-3 shadow-lift"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-accent">+{displayAmount} XP</span>
        <span className="text-[11px] font-semibold text-faint">
          {gain.leveledUp ? "Subiu de nível!" : `Nível ${gain.level}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
        <motion.div
          className="h-full rounded-full accent-gradient"
          initial={reduceMotion ? { width: `${gain.progress * 100}%` } : { width: 0 }}
          animate={{ width: `${gain.progress * 100}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
        />
      </div>
      <div className="mt-1 text-right text-[10px] text-faint">
        {gain.xpIntoLevel}/{gain.xpForNextLevel} XP · Nível {gain.level}
      </div>
    </motion.div>
  );
}
