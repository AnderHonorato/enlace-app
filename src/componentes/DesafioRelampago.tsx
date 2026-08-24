"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap, Timer, RotateCcw, Play, Check, Pause } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

const DESAFIOS = [
  "Quantos beijos vocês conseguem dar em 60 segundos?",
  "Falem 'eu te amo' de formas diferentes — quantas conseguem?",
  "Listem o máximo de apelidos carinhosos que usam",
  "Façam caretas engraçadas — o outro tira foto!",
  "Abraço mais longo possível até o tempo acabar",
  "Descreva seu amor em 3 palavras diferentes a cada 10 segundos",
  "Façam cosquinhas um no outro — quem rir primeiro perde!",
  "Cantem juntos uma música — mesmo que desafinado!",
];

const TOTAL = 60;

const RESULT_MESSAGES = [
  "O tempo voa quando a gente se diverte! 🕊️",
  "Vocês arrasaram! Que venha o próximo 🔥",
  "Esse foi épico! Dá pra sentir o amor daqui 💞",
  "Tempo esgotado, mas a diversão continua! ✨",
  "Mais rápido que um beijo roubado! 😘",
];

function getRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Sorteia um item evitando repetir o último sorteado (quando a lista permite). */
function getRandomExcluding<T>(list: T[], exclude: T | null): T {
  if (list.length <= 1) return list[0];
  let pick: T;
  do {
    pick = list[Math.floor(Math.random() * list.length)];
  } while (pick === exclude);
  return pick;
}

const CIRCLE_R = 54;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

export function DesafioRelampago() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [challenge, setChallenge] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL);
  const [completed, setCompleted] = useState(0);
  const [resultMsg, setResultMsg] = useState("");
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastChallenge = useRef<string | null>(null);
  const reduzMovimento = useReducedMotion();

  const start = useCallback(() => {
    const c = getRandomExcluding(DESAFIOS, lastChallenge.current);
    lastChallenge.current = c;
    setChallenge(c);
    setTimeLeft(TOTAL);
    setResultMsg("");
    setPaused(false);
    setPhase("running");
  }, []);

  // Cronômetro: só corre enquanto "running" e não pausado. O cleanup roda
  // tanto na troca de fase/pausa quanto ao desmontar o componente, então
  // nunca fica um setInterval órfão contando em segundo plano.
  useEffect(() => {
    if (phase === "running" && !paused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, paused]);

  useEffect(() => {
    if (phase === "running" && timeLeft <= 0) {
      setPhase("done");
      setCompleted((c) => c + 1);
      setResultMsg(getRandom(RESULT_MESSAGES));
    }
  }, [timeLeft, phase]);

  const togglePause = () => setPaused((p) => !p);

  const progress = 1 - timeLeft / TOTAL;
  const offset = CIRCLE_C * (1 - progress);
  const urgent = timeLeft <= 10;

  return (
    <div>
      <h2 className="font-display text-3xl text-text">
        Desafio <span className="gradient-text">Relâmpago</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Complete o desafio antes que o tempo acabe!
      </p>

      {/* Placar */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface2/50 px-4 py-2.5">
        <Zap size={16} className="text-accent" />
        <span className="text-sm text-muted">
          <span className="font-semibold text-text">{completed}</span> completados nesta sessão
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -12 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              className="card flex w-full flex-col items-center gap-5 p-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/12">
                <Timer size={28} className="text-accent" />
              </div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Prontos para o desafio?
                </div>
                <p className="mt-1 text-sm text-faint">
                  Você terá 60 segundos para completar
                </p>
              </div>
              <button
                onClick={start}
                className="flex min-h-[40px] items-center gap-2 rounded-xl accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <Play size={17} />
                Começar
              </button>
            </motion.div>
          )}

          {phase === "running" && (
            <motion.div
              key="running"
              variants={{
                hidden: { opacity: 0, scale: 0.96 },
                show: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.96 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={spring.soft}
              className="card flex w-full flex-col items-center gap-5 p-6"
            >
              {/* Timer ring */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 140 140"
                  className="-rotate-90"
                >
                  <circle
                    cx="70"
                    cy="70"
                    r={CIRCLE_R}
                    fill="none"
                    stroke="rgb(var(--border))"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={CIRCLE_R}
                    fill="none"
                    stroke={urgent ? "rgb(var(--danger))" : "rgb(var(--accent))"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={CIRCLE_C}
                    strokeDashoffset={offset}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.3 }}
                    opacity={paused ? 0.5 : 1}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <motion.span
                    key={timeLeft}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "font-display text-4xl font-bold tabular-nums",
                      urgent ? "text-danger" : "text-text"
                    )}
                  >
                    {timeLeft}
                  </motion.span>
                  <span className="text-xs text-faint">
                    {paused ? "pausado" : "segundos"}
                  </span>
                </div>
              </div>

              {/* Desafio */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                  <Zap size={12} /> Desafio
                </span>
                <p className="mt-3 font-display text-xl leading-relaxed text-text">
                  {challenge}
                </p>
              </div>

              <button
                onClick={togglePause}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text"
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
                {paused ? "Continuar" : "Pausar"}
              </button>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              variants={{
                hidden: { opacity: 0, scale: 0.94 },
                show: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.94 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={spring.bouncy}
              className="card flex w-full flex-col items-center gap-5 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={spring.bouncy}
                className="text-5xl"
              >
                ⏰
              </motion.div>
              <div className="text-center">
                <div className="font-display text-2xl text-text">
                  Tempo esgotado!
                </div>
                <p className="mt-2 text-sm text-muted">{resultMsg}</p>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring.bouncy, delay: reduzMovimento ? 0 : 0.2 }}
                className="flex items-center gap-2 rounded-xl bg-success/12 px-4 py-2.5"
              >
                <Check size={16} className="text-success" />
                <span className="text-sm font-semibold text-success">
                  +1 desafio concluído!
                </span>
              </motion.div>

              <button
                onClick={start}
                className="flex min-h-[40px] items-center gap-2 rounded-xl accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <RotateCcw size={16} />
                Jogar de novo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
