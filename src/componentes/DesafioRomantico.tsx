"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Sparkles, RotateCcw, Check, Flame, Star, Gift } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

type RomanticCategory = "romantico" | "picante" | "surpresa";

interface RomanticCard {
  text: string;
  category: RomanticCategory;
}

const ROMANTIC_CARDS: RomanticCard[] = [
  { text: "Faça uma massagem de 5 minutos no seu amor", category: "romantico" },
  { text: "Sussurre algo provocante no ouvido do parceiro", category: "picante" },
  { text: "Dance uma música lenta bem coladinhos", category: "romantico" },
  { text: "Descreva em detalhes o que você mais ama no corpo do parceiro", category: "picante" },
  { text: "Tire uma foto bem provocante para o parceiro", category: "picante" },
  { text: "Faça uma promessa picante para hoje à noite", category: "picante" },
  { text: "Beije cada parte do rosto do parceiro lentamente", category: "romantico" },
  { text: "Escreva uma carta de amor em 3 minutos", category: "romantico" },
  { text: "Faça um strip tease improvisado", category: "picante" },
  { text: "Cozinhe algo especial para o seu amor", category: "surpresa" },
  { text: "Prepare um banho relaxante para os dois", category: "surpresa" },
  { text: "Declare seu amor em outra língua", category: "romantico" },
  { text: "Faça um desenho do seu amor (mesmo que fique engraçado)", category: "romantico" },
  { text: "Conte qual foi o momento mais excitante que viveram", category: "picante" },
  { text: "Monte uma playlist romântica para a noite", category: "surpresa" },
  { text: "Beije cada dedo do parceiro dizendo algo especial para cada um", category: "romantico" },
  { text: "Faça um elogio diferente para cada parte do corpo do parceiro", category: "picante" },
  { text: "Crie um apelido novo e carinhoso para o seu amor", category: "romantico" },
  { text: "Recrie o primeiro beijo de vocês", category: "romantico" },
  { text: "Envie uma mensagem de texto bem provocante mesmo estando juntos", category: "picante" },
  { text: "Faça um piquenique improvisado na sala", category: "surpresa" },
  { text: "Fale sobre a fantasia que vocês ainda não realizaram", category: "picante" },
  { text: "Olhe nos olhos do parceiro por 2 minutos sem falar nada", category: "romantico" },
  { text: "Planeje uma surpresa para o próximo fim de semana", category: "surpresa" },
  { text: "Descreva o jeito que seu amor te olha quando quer algo", category: "picante" },
  { text: "Cante uma música que represente seu amor", category: "romantico" },
  { text: "Escreva 10 coisas que você ama no parceiro em 2 minutos", category: "romantico" },
  { text: "Faça um vale-presente romântico para o parceiro usar quando quiser", category: "surpresa" },
];

const CATEGORIES: {
  key: RomanticCategory;
  label: string;
  icon: any;
  varName: string;
  emoji: string;
}[] = [
  { key: "romantico", label: "Romântico", icon: Heart, varName: "--accent", emoji: "💕" },
  { key: "picante", label: "Picante", icon: Flame, varName: "--danger", emoji: "🔥" },
  { key: "surpresa", label: "Surpresa", icon: Gift, varName: "--accent-2", emoji: "✨" },
];

/** Resolve um token CSS em rgb(), com alpha opcional — evita cravar hex no lugar do tema. */
function rgbVar(varName: string, alpha?: number) {
  return alpha != null ? `rgb(var(${varName}) / ${alpha})` : `rgb(var(${varName}))`;
}

const HEART_VARS = ["--accent", "--danger", "--warning", "--accent-2"];

/** Sorteia uma carta evitando repetir a última mostrada (quando a lista permite). */
function getRandomExcluding<T extends { text: string }>(list: T[], exclude: T | null): T {
  if (list.length <= 1) return list[0];
  let pick: T;
  do {
    pick = list[Math.floor(Math.random() * list.length)];
  } while (exclude && pick.text === exclude.text);
  return pick;
}

export function DesafioRomantico() {
  const [currentCard, setCurrentCard] = useState<RomanticCard | null>(null);
  const [completed, setCompleted] = useState(0);
  const [showingCard, setShowingCard] = useState(false);
  const [hearts, setHearts] = useState<
    { id: number; x: number; y: number; varName: string; size: number; delay: number }[]
  >([]);
  const [sparkles, setSparkles] = useState(false);
  const lastCard = useRef<RomanticCard | null>(null);
  const reduzMovimento = useReducedMotion();

  const drawCard = useCallback(() => {
    setShowingCard(false);
    const next = getRandomExcluding(ROMANTIC_CARDS, lastCard.current);
    lastCard.current = next;

    if (reduzMovimento) {
      setCurrentCard(next);
      setShowingCard(true);
      return;
    }

    setSparkles(true);
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 300 - 150,
      y: -(Math.random() * 100 + 50),
      varName: HEART_VARS[Math.floor(Math.random() * HEART_VARS.length)],
      size: Math.random() * 16 + 10,
      delay: Math.random() * 0.3,
    }));
    setHearts(newHearts);

    setTimeout(() => {
      setCurrentCard(next);
      setShowingCard(true);
      setSparkles(false);
    }, 400);
  }, [reduzMovimento]);

  const handleDone = () => {
    setCompleted((c) => c + 1);
    setCurrentCard(null);
    setShowingCard(false);
  };

  const catInfo = currentCard
    ? CATEGORIES.find((c) => c.key === currentCard.category) ?? CATEGORIES[0]
    : null;

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl text-text">
          Desafios <span className="text-accent">Românticos</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Aqueça o coração e o amor entre vocês
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5">
          <Heart size={16} className="text-warning" />
          <span className="text-sm text-muted">
            <span className="font-semibold text-text">{completed}</span> desafios completados
          </span>
        </div>

        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat.key}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: rgbVar(cat.varName, 0.3), color: rgbVar(cat.varName) }}
            >
              <cat.icon size={12} />
              {cat.emoji} {cat.label}
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!currentCard && !sparkles && (
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
              className="card flex flex-col items-center gap-5 p-8"
            >
              <motion.div
                animate={reduzMovimento ? undefined : { scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15"
              >
                <Heart size={36} className="fill-accent text-accent" />
              </motion.div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Prontos para se apaixonar de novo?
                </div>
                <p className="mt-1 text-sm text-faint">
                  Puxe uma carta e viva um momento especial
                </p>
              </div>
              <button
                onClick={drawCard}
                className="flex min-h-[40px] items-center gap-2 rounded-xl accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <Sparkles size={17} />
                Puxar carta
              </button>
            </motion.div>
          )}

          {sparkles && (
            <motion.div
              key="sparkles"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring.soft}
              className="card relative flex items-center justify-center overflow-hidden p-20"
            >
              {hearts.map((h) => (
                <motion.div
                  key={h.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: h.x,
                    y: h.y,
                    opacity: [1, 0.8, 0],
                    scale: [0, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: h.delay,
                    ease: "easeOut",
                  }}
                  className="pointer-events-none absolute left-1/2 top-1/2"
                >
                  <Heart
                    size={h.size}
                    className="fill-current"
                    style={{ color: rgbVar(h.varName) }}
                  />
                </motion.div>
              ))}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, ease: "linear" }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15"
              >
                <Star size={28} className="text-accent" />
              </motion.div>
            </motion.div>
          )}

          {currentCard && showingCard && catInfo && (
            <motion.div
              key={`card-${currentCard.text}`}
              initial={
                reduzMovimento
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.8, y: 30 }
              }
              animate={
                reduzMovimento
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={{ ...spring.bouncy, duration: 0.6 }}
              className="card relative overflow-hidden"
              style={{ borderColor: rgbVar(catInfo.varName, 0.27) }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-8"
                style={{
                  background: `linear-gradient(135deg, transparent, ${rgbVar(catInfo.varName)})`,
                }}
              />

              <div className="relative p-0">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ background: rgbVar(catInfo.varName) }}
                  >
                    <catInfo.icon size={12} /> {catInfo.emoji} {catInfo.label}
                  </span>
                  <Heart
                    size={16}
                    className="fill-current"
                    style={{ color: rgbVar(catInfo.varName) }}
                  />
                </div>

                <div className="px-6 py-8 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduzMovimento ? 0 : 0.15 }}
                    className="mb-5 text-4xl"
                  >
                    {catInfo.emoji}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduzMovimento ? 0 : 0.25 }}
                    className="font-display text-xl leading-relaxed text-text"
                  >
                    {currentCard.text}
                  </motion.p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4">
                  <button
                    onClick={handleDone}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                    style={{ background: rgbVar(catInfo.varName) }}
                  >
                    <Check size={16} />
                    Concluído!
                  </button>
                  <button
                    onClick={drawCard}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted transition hover:bg-surface2/60 hover:text-text"
                  >
                    <RotateCcw size={16} />
                    Pular
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentCard === null && completed > 0 && !sparkles && !showingCard && (
            <motion.div
              key="next"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={spring.bouncy}
                className="text-4xl"
              >
                💖
              </motion.div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Que lindo!
                </div>
                <p className="mt-1 text-sm text-faint">
                  O amor está no ar. Continue espalhando carinho.
                </p>
              </div>
              <button
                onClick={drawCard}
                className="flex min-h-[40px] items-center gap-2 rounded-xl accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <Heart size={17} className="fill-white" />
                Mais um desafio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
