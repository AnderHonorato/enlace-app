"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevron } from "../IconesRetrospectiva";
import { moonPhase, seasonOf, constellationOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";
import { EASE_OUT, spring } from "@/nucleo/movimento";

const box = "rounded-2xl bg-white/15 px-2.5 py-2 backdrop-blur";



export function LiveCounter({ from }: { from: string }) {
  const start = useMemo(() => new Date(from).getTime(), [from]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, now - start);
  const dias = Math.floor(total / 86400000);
  const horas = Math.floor((total % 86400000) / 3600000);
  const min = Math.floor((total % 3600000) / 60000);
  const seg = Math.floor((total % 60000) / 1000);

  const Unit = ({ v, l, pad = 2 }: { v: number; l: string; pad?: number }) => (
    <div className="flex flex-col items-center">
      <div className={box}>
        <div className="overflow-hidden font-display text-3xl leading-none tabular-nums sm:text-4xl">
          <motion.div
            key={v}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
          >
            {String(v).padStart(pad, "0")}
          </motion.div>
        </div>
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">{l}</span>
    </div>
  );

  return (
    <div className="w-full">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.gentle}
        className="flex items-start justify-center gap-2"
      >
        <div className="flex flex-col items-center">
          <div className={box}>
            <div className="font-display text-3xl leading-none tabular-nums sm:text-4xl">
              {dias.toLocaleString("pt-BR")}
            </div>
          </div>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">dias</span>
        </div>
        <Unit v={horas} l="horas" />
        <Unit v={min} l="min" />
        <Unit v={seg} l="seg" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-center text-[15px]"
      >
        E continua contando, agora mesmo.
      </motion.p>
    </div>
  );
}

/* ────────────────────────── Conquistas ────────────────────────── */

/** Cartão de conquista, no estilo "achievement unlocked". */
export function AchievementCard({ a, index = 0 }: { a: Achievement; index?: number }) {
  const color = TIER_COLOR[a.tier];
  return (
    <motion.div
      initial={{ opacity: 0, x: -30, rotateY: -25 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ ...spring.soft, delay: 0.2 + index * 0.14 }}
      className="flex items-center gap-3 rounded-2xl border bg-black/25 p-3 backdrop-blur"
      style={{ borderColor: `${color}88` }}
    >
      <motion.span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ background: `${color}33`, boxShadow: `0 0 18px ${color}55` }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.3 }}
      >
        {a.emoji}
      </motion.span>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-white">{a.title}</span>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${color}33`, color }}
          >
            {a.tier}
          </span>
        </div>
        <p className="truncate text-[13px] text-white/70">{a.desc}</p>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Linha do tempo ────────────────────────── */

export type TimelineItem = { date: string; title: string; photo: string | null; author: string };

/** "Nossa Jornada": marcos em sequência, com a linha se desenhando. */
export function JourneyTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative w-full max-w-sm">
      {/* trilho que cresce de cima para baixo */}
      <motion.div
        className="absolute left-[15px] top-2 w-0.5 origin-top bg-white/40"
        style={{ bottom: 8 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.2 }}
      />
      <div className="space-y-3">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring.soft, delay: 0.35 + i * 0.2 }}
            className="relative flex items-center gap-3 pl-9"
          >
            <motion.span
              className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs backdrop-blur"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.35 + i * 0.2 }}
            >
              {i + 1}
            </motion.span>
            {it.photo && (
              <img
                src={it.photo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border border-white/40 object-cover"
              />
            )}
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-semibold text-white">{it.title}</div>
              <div className="text-[11px] text-white/65">
                {new Date(it.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                {it.author}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── Mapa da jornada ────────────────────────── */

export type JourneyPlace = { name: string; count: number; photo: string | null };

/**
 * Mapa dos lugares. Sem coordenadas reais na maioria dos registros, o mapa é
 * uma constelação de lugares — cada ponto marcado numa posição estável.
 */
export function PlacesMap({ places }: { places: JourneyPlace[] }) {
  const spots = useMemo(() => starField(places.length, places.length * 13 + 1), [places.length]);
  return (
    <div className="relative h-[min(19rem,40vh)] w-full max-w-sm">
      {/* meridianos, sugerindo um globo */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-25">
        <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="white" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="18" ry="46" fill="none" stroke="white" strokeWidth="0.4" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="white" strokeWidth="0.4" />
      </svg>

      {places.slice(0, 8).map((p, i) => {
        const s = spots[i] ?? { x: 50, y: 50 };
        const x = 14 + (s.x / 100) * 68;
        const y = 12 + (s.y / 100) * 70;
        return (
          <motion.div
            key={p.name}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, scale: 0.3, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...spring.bouncy, delay: 0.25 + i * 0.16 }}
          >
            <motion.span
              className="relative flex h-3 w-3 shrink-0 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
            />
            <span className="max-w-[8.5rem] truncate rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur" title={p.name}>
              {p.name}
              {p.count > 1 && <span className="ml-1 text-white/60">×{p.count}</span>}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────── O aplicativo inteiro ─────────────────────── */
