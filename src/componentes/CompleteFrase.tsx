"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Send, RotateCcw, Bookmark, Check, Sparkles } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, fadeUp, heartBeat } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";

interface SavedPhrase {
  text: string;
  date: string;
}

const XP_PER_COMPLETION = 30;

const FRASES = [
  "Eu gosto de você porque...",
  "Nosso encontro perfeito seria...",
  "O que eu mais admiro em você é...",
  "Meu momento favorito com você foi...",
  "Se eu pudesse te dar um presente seria...",
  "Você me faz sentir...",
  "Quando penso no futuro, vejo...",
  "Nossa música seria...",
  "Meu apelido secreto pra você é...",
  "O que ninguém sabe sobre nós é...",
  "O melhor conselho de amor que recebi foi...",
  "Se eu pudesse voltar no tempo, eu...",
  "A coisa mais engraçada que já fizemos juntos foi...",
  "O que eu nunca te contei, mas quero que saiba é...",
  "Nosso maior desafio como casal foi...",
  "Sempre que olho pra você, penso...",
  "O primeiro pensamento que tive ao te ver foi...",
  "Uma tradição nossa que eu amo é...",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CompleteFrase() {
  const { addXP, markPlayed } = useGameXP();
  const reduceMotion = useReducedMotion();
  const [phrases, setPhrases] = useState<string[]>(FRASES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  const currentPhrase = phrases[currentIndex % phrases.length];

  useEffect(() => {
    setPhrases(shuffleArray(FRASES));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    setSubmitted(true);
    setCompleted((c) => c + 1);
    addXP(XP_PER_COMPLETION);
    markPlayed();
  }, [input, addXP, markPlayed]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= phrases.length) {
      setPhrases(shuffleArray(FRASES));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
    setInput("");
    setSubmitted(false);
    setJustSaved(false);
  }, [currentIndex, phrases.length]);

  const handleSave = useCallback(() => {
    if (justSaved) return;
    const phrase = currentPhrase;
    const ending = input.trim();
    if (!ending) return;
    setSavedPhrases((prev) => [
      ...prev,
      { text: `${phrase} ${ending}`, date: new Date().toISOString().slice(0, 10) },
    ]);
    setJustSaved(true);
  }, [currentPhrase, input, justSaved]);

  const handleReset = useCallback(() => {
    setPhrases(shuffleArray(FRASES));
    setCurrentIndex(0);
    setInput("");
    setSubmitted(false);
    setCompleted(0);
    setSavedPhrases([]);
    setJustSaved(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text">
            Complete a <span className="gradient-text">Frase</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            {completed} frase{completed !== 1 ? "s" : ""} completada{completed !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-muted/40 hover:text-text"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key={`input-${currentIndex}`}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit="exit"
            className="rounded-2xl border border-border bg-surface p-6 space-y-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                <Heart size={16} />
              </span>
              <div>
                <p className="font-display text-xl leading-relaxed text-text">
                  &ldquo;{currentPhrase}&rdquo;
                </p>
                <p className="mt-2 text-xs text-faint">
                  Frase {currentIndex + 1} de {phrases.length}
                </p>
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Complete a frase aqui..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-text placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={cn(
                "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition",
                input.trim()
                  ? "bg-accent text-white hover:bg-accent/90"
                  : "bg-muted/10 text-muted cursor-not-allowed"
              )}
            >
              <Send size={15} />
              Enviar resposta
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`result-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring.bouncy}
            className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-6 space-y-5 shadow-glow"
          >
            {/* Brilho decorativo atrás da frase revelada — o "ponto alto" do jogo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
            />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/20">
                <Check size={14} className="text-success" />
              </span>
              <span className="text-sm font-medium text-success">+{XP_PER_COMPLETION} XP</span>
              <motion.span
                initial={reduceMotion ? false : { rotate: -10, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ ...spring.bouncy, delay: 0.15 }}
                className="ml-auto text-accent2"
              >
                <Sparkles size={16} />
              </motion.span>
            </div>

            <div className="relative rounded-xl border border-accent/25 bg-accent/5 p-5">
              <motion.span
                animate={reduceMotion ? undefined : heartBeat}
                className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lift"
              >
                <Heart size={14} fill="currentColor" />
              </motion.span>
              <p className="font-display text-xl leading-relaxed text-text">
                &ldquo;{currentPhrase}&rdquo;
              </p>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-3 text-lg font-medium leading-relaxed text-accent2 italic"
              >
                {input}
              </motion.p>
              <p className="mt-4 text-xs text-muted">
                {completed} frase{completed !== 1 ? "s" : ""} completada{completed !== 1 ? "s" : ""} — Ganhe +{XP_PER_COMPLETION} XP por cada!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={justSaved || !input.trim()}
                className={cn(
                  "flex min-h-[40px] items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition",
                  justSaved
                    ? "bg-success/20 text-success cursor-default"
                    : "border border-border text-muted hover:text-text hover:border-muted/40"
                )}
              >
                {justSaved ? <Check size={14} /> : <Bookmark size={14} />}
                {justSaved ? "Salvo!" : "Salvar frase"}
              </button>
              <button
                onClick={handleNext}
                className="flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Próxima frase
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {savedPhrases.length > 0 && (
        <div className="scrap-frame scrap-frame-quiet space-y-4 rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-display text-lg text-text flex items-center gap-2">
            <Bookmark size={16} className="text-accent" />
            Frases do Casal
          </h3>
          <div className="space-y-3">
            {savedPhrases.map((sp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-surface2 p-4"
              >
                <p className="text-sm leading-relaxed text-text">&ldquo;{sp.text}&rdquo;</p>
                <p className="mt-1.5 text-[11px] text-faint">{sp.date}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
