"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Timer,
  RotateCcw,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, EASE_OUT } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";

const CATEGORIES = [
  { key: "nome", label: "Nome", emoji: "👤" },
  { key: "cidade", label: "Cidade", emoji: "🏙️" },
  { key: "comida", label: "Comida", emoji: "🍝" },
  { key: "filme", label: "Filme", emoji: "🎬" },
  { key: "musica", label: "Música", emoji: "🎵" },
  { key: "animal", label: "Animal", emoji: "🐾" },
  { key: "cor", label: "Cor", emoji: "🎨" },
  { key: "profissao", label: "Profissão", emoji: "💼" },
];

type Answers = Record<string, string>;

type ComparisonResult = {
  category: string;
  answer1: string;
  answer2: string;
  p1Points: number;
  p2Points: number;
  result: "p1_only" | "p2_only" | "tie_blank" | "tie_match" | "both_unique";
};

type Results = {
  p1Score: number;
  p2Score: number;
  comparisons: ComparisonResult[];
};

const LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ";
const TOTAL_TIME = 60;
const XP_PER_POINT = 2;

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

export function StopAdedonha() {
  const { addXP, markPlayed } = useGameXP();
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<"idle" | "player1" | "player2" | "compare">("idle");
  const [letter, setLetter] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [player1Answers, setPlayer1Answers] = useState<Answers>({});
  const [player2Answers, setPlayer2Answers] = useState<Answers>({});
  const [currentAnswers, setCurrentAnswers] = useState<Answers>({});
  const [results, setResults] = useState<Results | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleStart = useCallback(() => {
    const l = randomLetter();
    setLetter(l);
    setTimeLeft(TOTAL_TIME);
    setPlayer1Answers({});
    setPlayer2Answers({});
    setCurrentAnswers({});
    setResults(null);
    setPhase("player1");
  }, []);

  useEffect(() => {
    if (phase === "player1" || phase === "player2") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    // Sempre limpa o intervalo anterior — evita dois timers rodando ao
    // trocar de fase e garante que nada continue contando após desmontar.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (timeLeft <= 0 && (phase === "player1" || phase === "player2")) {
      if (phase === "player1") {
        setPlayer1Answers({ ...currentAnswers });
        setCurrentAnswers({});
        setTimeLeft(TOTAL_TIME);
        setPhase("player2");
      } else if (phase === "player2") {
        calculateResults({ ...currentAnswers });
        markPlayed();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function calculateResults(p2Answers: Answers) {
    let p1Score = 0;
    let p2Score = 0;
    const comparisons: ComparisonResult[] = [];

    CATEGORIES.forEach((cat) => {
      const a1 = (player1Answers[cat.key] || "").trim().toLowerCase();
      const a2 = (p2Answers[cat.key] || "").trim().toLowerCase();
      const startsCorrect1 = a1.length > 0 && a1.startsWith(letter.toLowerCase());
      const startsCorrect2 = a2.length > 0 && a2.startsWith(letter.toLowerCase());

      let p1Points = 0;
      let p2Points = 0;
      let result: ComparisonResult["result"];

      if (!startsCorrect1 && !startsCorrect2) {
        // Ninguém respondeu com a letra certa — ninguém pontua.
        result = "tie_blank";
      } else if (!startsCorrect1) {
        p2Points = 10;
        result = "p2_only";
      } else if (!startsCorrect2) {
        p1Points = 10;
        result = "p1_only";
      } else if (a1 === a2) {
        // Os dois responderam a mesma coisa: 5 pts cada (regra clássica do Stop).
        p1Points = 5;
        p2Points = 5;
        result = "tie_match";
      } else {
        // Os dois responderam válido e diferente: 10 pts cada — ninguém "rouba"
        // ponto do outro só por ter respondido primeiro na comparação.
        p1Points = 10;
        p2Points = 10;
        result = "both_unique";
      }

      p1Score += p1Points;
      p2Score += p2Points;

      comparisons.push({
        category: cat.key,
        answer1: player1Answers[cat.key] || "",
        answer2: p2Answers[cat.key] || "",
        p1Points,
        p2Points,
        result,
      });
    });

    setResults({ p1Score, p2Score, comparisons });
    setPlayer2Answers(p2Answers);
    addXP(Math.floor((p1Score + p2Score) * XP_PER_POINT));
    setCurrentAnswers({});
    setPhase("compare");
  }

  function handleAnswerChange(catKey: string, value: string) {
    setCurrentAnswers((prev) => ({ ...prev, [catKey]: value }));
  }

  function handleTimeUp() {
    const answeredCount = Object.values(currentAnswers).filter((v) => v.trim()).length;
    if (answeredCount === 0) {
      const ok = window.confirm("Você ainda não preencheu nenhuma resposta. Terminar mesmo assim?");
      if (!ok) return;
    }
    setTimeLeft(0);
  }

  function handleReset() {
    setPhase("idle");
    setLetter("");
    setTimeLeft(TOTAL_TIME);
    setPlayer1Answers({});
    setPlayer2Answers({});
    setCurrentAnswers({});
    setResults(null);
  }

  function focusNext(index: number) {
    const next = inputRefs.current[index + 1];
    if (next) {
      next.focus();
    } else {
      inputRefs.current[index]?.blur();
    }
  }

  const progress = 1 - timeLeft / TOTAL_TIME;
  const urgent = timeLeft <= 10;
  const veryUrgent = timeLeft <= 5;
  const isPlaying = phase === "player1" || phase === "player2";
  const answeredCount = Object.values(currentAnswers).filter((v) => v.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text">
            Stop! <span className="gradient-text">Adedonha</span>
          </h2>
          <p className="mt-1 text-sm text-muted">Preencham com a letra sorteada antes do tempo acabar</p>
        </div>
        <button
          onClick={handleReset}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-muted/40 hover:text-text"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      {phase === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.snappy}
          className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-10"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <Users size={32} className="text-accent" />
          </span>
          <div className="text-center">
            <p className="font-display text-2xl text-text">Prontos para o Stop?</p>
            <p className="mt-2 text-sm text-muted max-w-xs">
              Uma letra será sorteada. Cada jogador preenche as categorias em segredo. Depois comparem as respostas!
            </p>
          </div>
          <button
            onClick={handleStart}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-8 py-3 text-base font-semibold text-white transition hover:bg-accent/90"
          >
            <Play size={18} />
            Sortear Letra
          </button>
        </motion.div>
      )}

      {isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.snappy}
          className="space-y-5"
        >
          <div
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-surface p-4 transition-colors",
              urgent ? "border-danger/50" : "border-border"
            )}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-3xl font-bold text-accent">
              {letter}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-text">
                Vez do Jogador {phase === "player1" ? "1" : "2"}
              </p>
              <p className="text-sm text-muted">
                Preencha com a letra <strong className="text-text">{letter}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Timer
                size={20}
                className={cn(urgent ? "text-danger animate-pulse" : "text-accent")}
              />
              <motion.span
                key={veryUrgent ? "very-urgent" : "normal"}
                animate={
                  urgent && !reduceMotion
                    ? { scale: [1, 1.16, 1] }
                    : { scale: 1 }
                }
                transition={
                  urgent
                    ? { duration: veryUrgent ? 0.5 : 0.8, repeat: Infinity, ease: EASE_OUT }
                    : spring.snappy
                }
                className={cn(
                  "text-2xl font-mono font-bold tabular-nums",
                  urgent ? "text-danger" : "text-text"
                )}
              >
                {timeLeft}
              </motion.span>
            </div>
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={cat.key}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-sm">
                  {cat.emoji}
                </span>
                <span className="w-20 shrink-0 text-sm font-medium text-text">{cat.label}</span>
                <input
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={currentAnswers[cat.key] || ""}
                  onChange={(e) => handleAnswerChange(cat.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      focusNext(idx);
                    }
                  }}
                  placeholder={`${cat.label}...`}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint={idx === CATEGORIES.length - 1 ? "done" : "next"}
                  className="min-h-[40px] flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-faint focus:border-accent/50 focus:outline-none transition"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleTimeUp}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              <Timer size={15} />
              Terminei!
            </button>
            <p className="text-center text-xs text-faint">
              {answeredCount} de {CATEGORIES.length} preenchidas
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
            <motion.div
              className={cn("h-full rounded-full", urgent ? "bg-danger" : "bg-accent")}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </motion.div>
      )}

      {phase === "compare" && results && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.snappy}
          className="space-y-5"
        >
          <div className="scrap-frame scrap-frame-quiet flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="text-center flex-1">
              <p className="text-xs text-muted uppercase tracking-wider">Jogador 1</p>
              <motion.p
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.bouncy}
                className={cn(
                  "text-3xl font-bold",
                  results.p1Score > results.p2Score ? "text-accent" : "text-text"
                )}
              >
                {results.p1Score}
              </motion.p>
            </div>
            <span className="text-2xl text-muted font-display">vs</span>
            <div className="text-center flex-1">
              <p className="text-xs text-muted uppercase tracking-wider">Jogador 2</p>
              <motion.p
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...spring.bouncy, delay: 0.08 }}
                className={cn(
                  "text-3xl font-bold",
                  results.p2Score > results.p1Score ? "text-accent" : "text-text"
                )}
              >
                {results.p2Score}
              </motion.p>
            </div>
          </div>

          <div className="scrap-frame scrap-frame-quiet overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-surface2 p-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <div className="bg-surface px-4 py-2.5 rounded-tl-2xl">Categoria</div>
              <div className="bg-surface px-4 py-2.5">Jogador 1</div>
              <div className="bg-surface px-4 py-2.5 rounded-tr-2xl">Jogador 2</div>
            </div>

            {results.comparisons.map((comp, i) => {
              const cat = CATEGORIES.find((c) => c.key === comp.category)!;
              return (
                <div
                  key={comp.category}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_1fr] gap-px items-center text-sm",
                    i % 2 === 0 ? "bg-surface" : "bg-surface2/50"
                  )}
                >
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span>{cat.emoji}</span>
                    <span className="text-text">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3">
                    <span className={cn(comp.answer1 ? "text-text" : "text-faint italic")}>
                      {comp.answer1 || "—"}
                    </span>
                    {comp.p1Points > 0 && (
                      <span className="text-[10px] font-bold text-success">{comp.p1Points}pts</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3">
                    <span className={cn(comp.answer2 ? "text-text" : "text-faint italic")}>
                      {comp.answer2 || "—"}
                    </span>
                    {comp.p2Points > 0 && (
                      <span className="text-[10px] font-bold text-success">{comp.p2Points}pts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="scrap-frame scrap-frame-botanical rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-sm text-muted">
              Vocês ganharam{" "}
              <strong className="text-text">
                {Math.floor((results.p1Score + results.p2Score) * XP_PER_POINT)} XP
              </strong>
            </p>
            <p className="text-xs text-faint mt-1">
              10 pts por resposta única • 5 pts por resposta igual
            </p>
          </div>

          <button
            onClick={handleStart}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            <Sparkles size={15} />
            Jogar novamente
          </button>
        </motion.div>
      )}
    </div>
  );
}
