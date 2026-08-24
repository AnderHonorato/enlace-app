"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RotateCcw, Check, X, Trophy } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, tap } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";
import { GameArt } from "./ArteJogo";

interface MovieQuestion {
  clues: [string, string, string];
  options: string[];
  correct: number;
}

const XP_PER_CORRECT = 25;
const XP_FULL_SCORE = 50;

const MOVIES: MovieQuestion[] = [
  { clues: ["savana", "herdeiro", "pedra"], options: ["O Rei Leão", "Madagascar", "Tarzan", "Mogli"], correct: 0 },
  { clues: ["transatlântico", "colar azul", "iceberg"], options: ["Titanic", "Poseidon", "Mar em Fúria", "O Naufrágio"], correct: 0 },
  { clues: ["cicatriz", "escola de magia", "castelo"], options: ["Harry Potter", "Senhor dos Anéis", "As Crônicas de Nárnia", "Percy Jackson"], correct: 0 },
  { clues: ["anel", "vulcão", "jornada"], options: ["Senhor dos Anéis", "Game of Thrones", "Vikings", "O Hobbit"], correct: 0 },
  { clues: ["Paris", "cozinha", "pequeno chef"], options: ["Ratatouille", "Kung Fu Panda", "Zootopia", "O Rei Leão"], correct: 0 },
  { clues: ["assombração", "equipe", "capturador"], options: ["Ghostbusters", "Atividade Paranormal", "Invocação do Mal", "Sexto Sentido"], correct: 0 },
  { clues: ["âmbar", "parque", "dinossauros"], options: ["Jurassic Park", "Godzilla", "King Kong", "Planeta dos Macacos"], correct: 0 },
  { clues: ["duas irmãs", "reino", "gelo"], options: ["Frozen", "Valente", "Moana", "Enrolados"], correct: 0 },
  { clues: ["máscara", "teia", "cidade"], options: ["Homem-Aranha", "Batman", "Homem de Ferro", "Deadpool"], correct: 0 },
  { clues: ["milharal", "relógio", "espaço"], options: ["Interestelar", "Gravidade", "Perdido em Marte", "2001: Odisseia no Espaço"], correct: 0 },
  { clues: ["casa", "balões", "viagem"], options: ["Up: Altas Aventuras", "Wall-E", "Toy Story", "Meu Malvado Favorito"], correct: 0 },
  { clues: ["dança", "guarda-chuva", "Hollywood"], options: ["Cantando na Chuva", "Grease", "Dirty Dancing", "La La Land"], correct: 0 },
  { clues: ["recife", "pai", "oceano"], options: ["Procurando Nemo", "O Espanta Tubarões", "A Pequena Sereia", "Peixe Grande"], correct: 0 },
  { clues: ["herói noturno", "caos", "grande cidade"], options: ["Batman: O Cavaleiro das Trevas", "Coringa", "Suicide Squad", "Watchmen"], correct: 0 },
  { clues: ["macarrão", "artes marciais", "guerreiro"], options: ["Kung Fu Panda", "Madagascar", "A Era do Gelo", "Shrek"], correct: 0 },
  { clues: ["castelo", "maldição", "chapéu"], options: ["O Castelo Animado", "Frozen 2", "Enrolados", "A Bela e a Fera"], correct: 0 },
  { clues: ["robô", "planta", "nave"], options: ["Wall-E", "Robôs", "Big Hero", "Megamente"], correct: 0 },
  { clues: ["pista", "corrida", "amizade"], options: ["Relâmpago McQueen", "Velozes e Furiosos", "Taxi", "Carros"], correct: 3 },
  { clues: ["ilha", "dragão", "amizade"], options: ["Como Treinar Seu Dragão", "O Hobbit", "Eragon", "Mulan"], correct: 0 },
  { clues: ["memórias", "emoções", "mente"], options: ["Divertida Mente", "Soul", "Viva: A Vida é uma Festa", "Enrolados"], correct: 0 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizFilmeEmoji() {
  const shouldReduceMotion = useReducedMotion();
  const { addXP, markPlayed } = useGameXP();
  const [questions, setQuestions] = useState<MovieQuestion[]>(MOVIES.slice(0, 8));

  useEffect(() => {
    setQuestions(shuffleArray(MOVIES).slice(0, 8));
  }, []);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);

  const currentQ = questions[current];
  const isLast = current >= questions.length - 1;

  const handleSelect = useCallback(
    (idx: number) => {
      if (revealed) return;
      setSelected(idx);
      setRevealed(true);

      const isCorrect = idx === currentQ.correct;
      if (isCorrect) {
        setScore((s) => s + 1);
        addXP(XP_PER_CORRECT);
      }
      setAnswers((prev) => [...prev, { correct: isCorrect }]);
      markPlayed();
    },
    [revealed, currentQ, addXP, markPlayed]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      const bonus = score === questions.length ? XP_FULL_SCORE : 0;
      if (bonus > 0) {
        addXP(bonus);
      }
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  }, [isLast, score, questions.length, addXP]);

  const handleReset = useCallback(() => {
    setQuestions(shuffleArray(MOVIES).slice(0, 8));
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
  }, []);

  const finished = current >= questions.length;

  if (finished) {
    const perfect = score === questions.length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.bouncy}
        className="rounded-2xl border border-border bg-surface p-8 text-center space-y-5"
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <Trophy size={28} className="text-accent" />
        </span>
        <h2 className="font-display text-2xl text-text">
          {perfect ? "Pontuação Perfeita!" : "Quiz Finalizado!"}
        </h2>
        <p className="text-4xl font-bold gradient-text">
          {score} / {questions.length}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          {pct}% de acerto
        </p>
        {perfect && (
          <p className="text-sm text-success font-medium">+{XP_FULL_SCORE} XP bônus por acertar todas!</p>
        )}
        <div className="flex justify-center gap-2 flex-wrap">
          {answers.map((a, i) => (
            <span
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                a.correct ? "bg-success/30 text-success" : "bg-danger/30 text-danger"
              )}
            >
              {a.correct ? <Check size={14} /> : <X size={14} />}
            </span>
          ))}
        </div>
        <motion.button
          whileTap={tap}
          onClick={handleReset}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          <RotateCcw size={14} />
          Jogar novamente
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-text">
            Quiz de <span className="gradient-text">Filmes</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Adivinhe o filme pelas pistas visuais — {score} acertos
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-muted/40 hover:text-text"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < current && answers[i]?.correct && "bg-success",
              i < current && !answers[i]?.correct && "bg-danger",
              i === current && "bg-accent",
              i > current && "bg-muted/20"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
          transition={spring.snappy}
          className="rounded-2xl border border-border bg-surface p-6 space-y-5"
        >
          <div className="grid grid-cols-[110px_1fr] items-center gap-3 text-left sm:grid-cols-[150px_1fr]">
            <span className="block h-24 text-text"><GameArt kind="film" /></span>
            <div className="grid gap-1.5">
              {currentQ.clues.map((clue, index) => <span key={clue} className="border border-border2 bg-bg px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-text">pista {index + 1} · {clue}</span>)}
            </div>
            <p className="col-span-2 mt-3 text-center text-xs font-medium text-muted">
              Pergunta {current + 1} de {questions.length}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === currentQ.correct;
              const isWrongPick = revealed && isSelected && !isCorrect;

              let borderClass = "border-border";
              let bgClass = "bg-surface2";
              let textClass = "text-text";

              if (revealed) {
                if (isCorrect) {
                  borderClass = "border-success/40";
                  bgClass = "bg-success/10";
                  textClass = "text-success";
                } else if (isWrongPick) {
                  borderClass = "border-danger/40";
                  bgClass = "bg-danger/10";
                  textClass = "text-danger";
                } else {
                  textClass = "text-muted";
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileTap={revealed ? undefined : tap}
                  animate={
                    isWrongPick && !shouldReduceMotion
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : revealed && isCorrect && !shouldReduceMotion
                        ? { scale: [1, 1.03, 1] }
                        : { x: 0, scale: 1 }
                  }
                  transition={isWrongPick ? { duration: 0.45 } : spring.snappy}
                  onClick={() => handleSelect(idx)}
                  disabled={revealed}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                    borderClass,
                    bgClass,
                    textClass,
                    !revealed && "hover:border-accent/30 hover:bg-accent/5"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      revealed && isCorrect && "border-success text-success",
                      isWrongPick && "border-danger text-danger",
                      !revealed && "border-border text-muted"
                    )}
                  >
                    {revealed && isCorrect ? (
                      <Check size={12} />
                    ) : isWrongPick ? (
                      <X size={12} />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  {option}
                </motion.button>
              );
            })}
          </div>

          {revealed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={tap}
              onClick={handleNext}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              {isLast ? "Ver resultado" : "Próxima"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
