"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/nucleo/movimento";
import type { FotoRetrospectiva } from "./tipos";

export function RevelacaoPalavra({ word }: { word: string }) {
  const letters = word.toUpperCase().slice(0, 8).split("");
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {letters.map((l, i) => (
        <motion.div
          key={i}
          initial={{ rotateX: 90, opacity: 0, backgroundColor: "rgba(255,255,255,0.12)" }}
          animate={{
            rotateX: 0,
            opacity: 1,
            backgroundColor: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.12)", "#4ABE7C"],
          }}
          transition={{
            duration: 0.5,
            delay: 0.35 + i * 0.22,
            backgroundColor: { duration: 0.5, delay: 0.9 + i * 0.22 },
          }}
          className="flex h-14 w-12 items-center justify-center rounded-lg border-2 border-white/40 font-display text-3xl font-bold text-white"
        >
          {l}
        </motion.div>
      ))}
    </div>
  );
}

/** Roleta que gira e para numa das opções do casal. */
export function RevelacaoRoleta({ options }: { options: string[] }) {
  const opts = options.slice(0, 8);
  // O sorteio é estável por render para o slide não trocar de resultado.
  const [chosen, setChosen] = useState(0);
  useEffect(() => {
    setChosen(opts.length ? Math.floor(Math.random() * opts.length) : 0);
  }, [opts.length]);
  const [spinning, setSpinning] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSpinning(false), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mt-4 w-full max-w-sm">
      <div className="relative mx-auto h-44 w-44">
        {/* ponteiro */}
        <div className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[14px] border-x-transparent border-t-white drop-shadow" />
        <motion.div
          className="h-full w-full rounded-full border-4 border-white/60 shadow-2xl"
          style={{
            background: `conic-gradient(${opts
              .map((_, i) => {
                const c = ["#E5679B", "#9575E8", "#5AA0F0", "#4ABEB0", "#E0A84A", "#F4726A", "#8B5CD6", "#F0883E"][i % 8];
                const from = (i / opts.length) * 360;
                const to = ((i + 1) / opts.length) * 360;
                return `${c} ${from}deg ${to}deg`;
              })
              .join(", ")})`,
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 * 4 + (360 - (chosen + 0.5) * (360 / opts.length)) }}
          transition={{ duration: 2.6, ease: [0.18, 0.9, 0.15, 1] }}
        />
        <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg" />
      </div>

      <AnimatePresence mode="wait">
        {spinning ? (
          <motion.p
            key="girando"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center text-sm"
          >
            Girando…
          </motion.p>
        ) : (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={spring.bouncy}
            className="mt-4 rounded-2xl bg-white/20 px-4 py-3 text-center backdrop-blur"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Caiu em</div>
            <div className="mt-0.5 font-display text-2xl leading-tight">{opts[chosen]}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
