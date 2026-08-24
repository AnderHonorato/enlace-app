"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Shuffle, Check, RotateCcw } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { IconFesta } from "./Icones";
import { spring } from "@/nucleo/movimento";

const VERDADES = [
  "Qual foi o momento mais feliz que você viveu com seu amor?",
  "O que você mais admira no seu parceiro(a)?",
  "Qual a primeira coisa que pensou quando viu seu amor pela primeira vez?",
  "Se pudesse voltar no tempo, que momento com seu amor reviveria?",
  "Qual música te lembra seu relacionamento?",
  "O que seu amor faz que te derrete?",
  "Qual sonho vocês dois ainda vão realizar juntos?",
  "Qual foi o presente mais especial que recebeu do seu amor?",
  "O que mudou na sua vida desde que conheceu seu amor?",
  "Qual qualidade do seu parceiro(a) você gostaria de ter?",
];

const DESAFIOS = [
  "Faça uma massagem de 5 minutos no seu amor",
  "Declare seu amor em voz alta, olhando nos olhos",
  "Dance uma música romântica agora mesmo",
  "Escreva uma cartinha de amor em 2 minutos",
  "Faça um elogio diferente para seu amor a cada 30s por 2 minutos",
  "Cante um trecho de uma música que lembre vocês",
  "Desenhe um coração e escreva o nome do seu amor dentro",
  "Conte uma história engraçada que viveram juntos",
  "Faça uma promessa para o futuro de vocês",
  "Tire uma selfie bem engraçada juntos agora",
];

type Mode = "verdade" | "desafio" | "aleatorio";

const MODES: { key: Mode; label: string; activeClass: string }[] = [
  { key: "verdade", label: "Verdade", activeClass: "bg-accent" },
  { key: "desafio", label: "Desafio", activeClass: "bg-success" },
  { key: "aleatorio", label: "Aleatório", activeClass: "bg-accent2" },
];

/** Sorteia um item evitando repetir o último sorteado (quando a lista permite). */
function getRandomExcluding<T>(list: T[], exclude: T | null): T {
  if (list.length <= 1) return list[0];
  let pick: T;
  do {
    pick = list[Math.floor(Math.random() * list.length)];
  } while (pick === exclude);
  return pick;
}

export function JogoVerdade() {
  const [mode, setMode] = useState<Mode>("aleatorio");
  const [current, setCurrent] = useState<string | null>(null);
  const [type, setType] = useState<"verdade" | "desafio" | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const lastPick = useRef<string | null>(null);
  const reduzMovimento = useReducedMotion();

  const draw = useCallback(() => {
    let pick: string;
    let t: "verdade" | "desafio";
    if (mode === "verdade") {
      pick = getRandomExcluding(VERDADES, lastPick.current);
      t = "verdade";
    } else if (mode === "desafio") {
      pick = getRandomExcluding(DESAFIOS, lastPick.current);
      t = "desafio";
    } else {
      const isTruth = Math.random() < 0.5;
      pick = isTruth
        ? getRandomExcluding(VERDADES, lastPick.current)
        : getRandomExcluding(DESAFIOS, lastPick.current);
      t = isTruth ? "verdade" : "desafio";
    }
    lastPick.current = pick;
    setCurrent(pick);
    setType(t);
    setFlipped(false);
  }, [mode]);

  const handleDone = () => {
    setCompleted((c) => c + 1);
    setFlipped(true);
  };

  const typeGradient =
    type === "verdade"
      ? "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))"
      : "linear-gradient(135deg, rgb(var(--success)), rgb(var(--accent-2)))";
  const typeBorder =
    type === "verdade" ? "rgb(var(--accent) / 0.27)" : "rgb(var(--success) / 0.27)";

  return (
    <div>
      <h2 className="font-display text-3xl text-text">
        Jogo da <span className="gradient-text">Verdade</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Responda ou execute — sem fugir!
      </p>

      {/* Modos */}
      <div className="mt-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setCurrent(null);
              setType(null);
              setFlipped(false);
            }}
            className={cn(
              "min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition",
              mode === m.key
                ? cn(m.activeClass, "text-white shadow-glow")
                : "border border-border bg-surface text-muted hover:text-text"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Placar */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface2/50 px-4 py-2.5">
        <Heart size={16} className="text-accent" />
        <span className="text-sm text-muted">
          <span className="font-semibold text-text">{completed}</span> completados
        </span>
      </div>

      {/* Card principal */}
      <div className="mt-5">
        {!current ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={draw}
            className="card relative flex w-full flex-col items-center gap-4 overflow-hidden p-8 transition hover:shadow-glow"
          >
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))",
                }}
              />
            </div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/12">
              <Shuffle size={28} className="text-accent" />
            </div>
            <span className="relative font-display text-xl text-text">
              Toque para revelar
            </span>
            <span className="relative text-sm text-faint">
              {mode === "verdade"
                ? "Uma pergunta vai aparecer"
                : mode === "desafio"
                  ? "Um desafio vai aparecer"
                  : "Pode ser verdade ou desafio"}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key={current}
            initial={reduzMovimento ? { opacity: 0 } : { rotateY: -90, opacity: 0 }}
            animate={reduzMovimento ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
            transition={spring.snappy}
            className="card relative overflow-hidden p-6"
            style={{ borderColor: typeBorder, perspective: 800 }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-8"
              style={{ background: typeGradient }}
            />

            <div className="relative">
              {/* Badge */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                style={{ background: typeGradient }}
              >
                {type === "verdade" ? (
                  <>
                    <Heart size={12} /> Verdade
                  </>
                ) : (
                  <>
                    <Shuffle size={12} /> Desafio
                  </>
                )}
              </span>

              {/* Pergunta/Desafio */}
              <p className="mt-4 font-display text-xl leading-relaxed text-text">
                {current}
              </p>

              {/* Ações */}
              {!flipped ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleDone}
                    className="flex min-h-[40px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
                    style={{ background: typeGradient }}
                  >
                    <Check size={16} />
                    Feito!
                  </button>
                  <button
                    onClick={draw}
                    className="flex min-h-[40px] items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text"
                  >
                    <RotateCcw size={16} />
                    Outra
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring.bouncy}
                    className="flex items-center gap-2 rounded-xl bg-success/12 px-4 py-2.5"
                  >
                    <span className="text-warning"><IconFesta size={20} /></span>
                    <span className="text-sm font-semibold text-success">
                      Mais um! Isso aí!
                    </span>
                  </motion.div>
                  <button
                    onClick={draw}
                    className="mt-3 flex min-h-[40px] items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text"
                  >
                    <RotateCcw size={16} />
                    Próximo
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
