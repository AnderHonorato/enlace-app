"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevron } from "../IconesRetrospectiva";
import { moonPhase, seasonOf, constellationOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";
import { EASE_OUT, spring } from "@/nucleo/movimento";
import { useHydrationSafeReducedMotion } from "./CenasBase";



export type RetroQuestion = { for: string; name: string; q: string; options: string[] };

/**
 * Perguntas no formato de conversa: uma por vez, balão da pergunta à esquerda
 * e a resposta escolhida virando balão à direita.
 *
 * Uma por vez é o que resolve o estouro de tela: a versão anterior empilhava
 * 4 perguntas × 4 opções de uma vez (~700px) e cortava no celular.
 */
export function QuestionsScene({
  questions,
  answers,
  onAnswer,
  meLabel = "Você",
}: {
  questions: RetroQuestion[];
  answers: Record<string, number>;
  onAnswer: (key: string, option: number) => void;
  meLabel?: string;
}) {
  const reduced = useHydrationSafeReducedMotion();
  const [step, setStep] = useState(0);
  const total = questions.length;
  const item = questions[Math.min(step, total - 1)];
  const key = `${item?.for}-${step}`;
  const picked = answers[key];
  const answered = picked !== undefined;

  // Depois de responder, caminha sozinho para a próxima — como um quiz de chat.
  useEffect(() => {
    if (!answered || step >= total - 1) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 1100);
    return () => clearTimeout(t);
  }, [answered, step, total]);

  if (!item) return null;
  const paraQuem = item.for === "me" ? meLabel : item.name;

  return (
    <div className="mt-3 w-full max-w-sm">
      {/* trilha de progresso das perguntas */}
      <div className="mb-3 flex items-center justify-center gap-1.5">
        {questions.map((_, i) => {
          const done = answers[`${questions[i].for}-${i}`] !== undefined;
          return (
            <motion.span
              key={i}
              layout
              className={cnx(
                "h-1.5 rounded-full transition-colors",
                i === step ? "w-6 bg-white" : done ? "w-1.5 bg-white/70" : "w-1.5 bg-white/30"
              )}
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 26 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -26 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
          className="space-y-2.5"
        >
          {/* de quem é a pergunta */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
            Para {paraQuem}
          </div>

          {/* balão da pergunta */}
          <motion.div
            initial={reduced ? {} : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.snappy}
            className="relative rounded-3xl rounded-tl-lg bg-white/16 px-4 py-3 text-left backdrop-blur"
          >
            <p className="text-[15px] leading-snug text-white">{item.q}</p>
            {/* rabinho do balão */}
            <span className="absolute -left-1 top-2 h-4 w-4 rotate-45 rounded-sm bg-white/16" />
          </motion.div>

          {/* opções OU a resposta escolhida */}
          <AnimatePresence mode="wait">
            {!answered ? (
              <motion.div
                key="opts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-1.5"
              >
                {item.options.map((opt, oi) => (
                  <motion.button
                    key={oi}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswer(key, oi);
                    }}
                    initial={reduced ? {} : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + oi * 0.05, duration: 0.24, ease: EASE_OUT }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-2xl border border-white/25 bg-white/8 px-3.5 py-2.5 text-left text-[13px] text-white/90 transition hover:border-white/50 hover:bg-white/20"
                  >
                    {opt}
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="answer"
                initial={{ opacity: 0, x: -18, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={spring.bouncy}
                className="flex justify-end"
              >
                <div className="relative max-w-[85%] rounded-3xl rounded-br-lg bg-white px-4 py-2.5 text-right shadow-xl">
                  <p className="text-[15px] font-semibold leading-snug text-[#6d3f63]">
                    {item.options[picked]}
                  </p>
                  <span className="absolute -right-1 bottom-2 h-4 w-4 rotate-45 rounded-sm bg-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* navegação manual entre perguntas */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-0"
              aria-label="Pergunta anterior"
            >
              <IconChevron dir="left" size={16} />
            </button>
            <span className="text-[11px] text-white/50">
              {step + 1} de {total}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStep((s) => Math.min(total - 1, s + 1));
              }}
              disabled={step >= total - 1}
              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-0"
              aria-label="Próxima pergunta"
            >
              <IconChevron dir="right" size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** cn local, para o arquivo não depender de utils. */
function cnx(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(" ");
}

/* ────────────────────────── Mapa estelar ────────────────────────── */

/**
 * O céu de uma data: constelação do período com as estrelas se acendendo
 * uma a uma e as linhas se desenhando depois.
 */
