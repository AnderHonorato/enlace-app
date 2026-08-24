"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevron } from "../IconesRetrospectiva";
import { moonPhase, seasonOf, constellationOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";
import { EASE_OUT, spring } from "@/nucleo/movimento";



export function StarMap({ date, label }: { date: string; label?: string }) {
  const c = useMemo(() => constellationOf(date), [date]);
  const bg = useMemo(() => starField(70, date.length + 5), [date]);

  return (
    <div className="w-full">
      {/* O disco acompanha a altura da tela para não empurrar o texto para fora. */}
      <div className="relative mx-auto aspect-square w-full max-w-[min(19rem,38vh)] overflow-hidden rounded-full border border-white/25 bg-[#0d0a24] shadow-2xl">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* poeira estelar de fundo */}
          {bg.map((s, i) => (
            <motion.circle
              key={`b${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r * 0.2}
              fill="#cfd8ff"
              initial={{ opacity: 0 }}
              animate={{ opacity: [s.o * 0.2, s.o * 0.7, s.o * 0.2] }}
              transition={{ duration: 2.4 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.3 }}
            />
          ))}

          {/* linhas da constelação, desenhadas depois das estrelas */}
          {c.lines.map(([a, b], i) => (
            <motion.line
              key={`l${i}`}
              x1={c.stars[a].x}
              y1={c.stars[a].y}
              x2={c.stars[b].x}
              y2={c.stars[b].y}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.1 + i * 0.22, ease: EASE_OUT }}
            />
          ))}

          {/* estrelas principais */}
          {c.stars.map((s, i) => (
            <motion.g key={`s${i}`}>
              <motion.circle
                cx={s.x}
                cy={s.y}
                r={s.r * 1.9}
                fill="#fff"
                opacity="0.2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.16, ease: EASE_OUT }}
              />
              <motion.circle
                cx={s.x}
                cy={s.y}
                r={s.r * 0.75}
                fill="#fff"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...spring.bouncy, delay: 0.25 + i * 0.16 }}
              />
            </motion.g>
          ))}
        </svg>

        {/* brilho no vidro */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/12 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mt-4 text-center"
      >
        <div className="text-2xl">{c.sign}</div>
        <div className="font-display text-2xl">{c.name}</div>
        {label && <div className="mt-0.5 text-sm text-white/70">{label}</div>}
        <p className="mt-1.5 text-sm italic text-white/80">{c.poem}</p>
      </motion.div>
    </div>
  );
}

/* ────────────────────────── Fase da lua ────────────────────────── */

/** Desenha a lua do dia com a iluminação real da data. */
export function MoonView({ date }: { date: string }) {
  const m = useMemo(() => moonPhase(date), [date]);
  const s = useMemo(() => seasonOf(date), [date]);
  // Deslocamento da sombra: 0 (cheia) a 1 (nova).
  const shift = (1 - m.illumination) * 44;
  const waning = m.fraction > 0.5;

  return (
    <div className="flex w-full flex-col items-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={spring.gentle}
        className="relative h-[min(11rem,28vh)] w-[min(11rem,28vh)]"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_28px_rgba(255,255,255,0.35)]">
          <defs>
            <radialGradient id="moon-face" cx="0.38" cy="0.32">
              <stop offset="0" stopColor="#FFFDF5" />
              <stop offset="1" stopColor="#D8CFE8" />
            </radialGradient>
            <clipPath id="moon-clip">
              <circle cx="50" cy="50" r="42" />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#moon-face)" />
          {/* crateras */}
          <g clipPath="url(#moon-clip)" fill="#BFB4D6" opacity="0.55">
            <circle cx="38" cy="38" r="7" />
            <circle cx="60" cy="56" r="5" />
            <circle cx="45" cy="66" r="4" />
            <circle cx="66" cy="34" r="3" />
          </g>
          {/* sombra que define a fase */}
          <g clipPath="url(#moon-clip)">
            <motion.circle
              cx={50 + (waning ? -shift : shift)}
              cy="50"
              r="42"
              fill="#1a1430"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.92 }}
              transition={{ duration: 1.1, delay: 0.4 }}
            />
          </g>
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-3 text-center"
      >
        <div className="font-display text-3xl">{m.name}</div>
        <div className="mt-1 text-sm text-white/80">
          {Math.round(m.illumination * 100)}% iluminada · {s.emoji} {s.name}
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────── Contador ao vivo ────────────────────────── */

const box = "rounded-2xl bg-white/15 px-2.5 py-2 backdrop-blur";

/** Contador que corre em tempo real desde uma data. */
