"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevron } from "../IconesRetrospectiva";
import { moonPhase, seasonOf, constellationOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";
import { EASE_OUT, spring } from "@/nucleo/movimento";



export function useHydrationSafeReducedMotion() { const prefers = useReducedMotion(); const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); return mounted && !!prefers; }
/* ────────────────────────── Fundo que evolui ────────────────────────── */

/**
 * Plano de fundo da retrospectiva. Em vez de duas bolhas paradas, ele
 * *avança junto com a história*: o gradiente gira, as bolhas trocam de lugar a
 * cada slide e uma luz atravessa a tela na entrada. Isso dá a sensação de
 * viagem — cada slide parece um lugar diferente, não a mesma tela repintada.
 */
export function RetroBackdrop({
  index,
  total,
  grad,
}: {
  index: number;
  total: number;
  grad: [string, string];
}) {
  const reduced = useHydrationSafeReducedMotion();
  // Ângulo do gradiente caminha ao longo da retrospectiva (150° → ~215°).
  const angle = 150 + (index / Math.max(1, total - 1)) * 65;

  // Posições das bolhas derivadas do índice: mudam a cada avanço, mas de forma
  // determinística (servidor e cliente desenham igual).
  const blobs = useMemo(() => {
    const r = starField(3, index * 17 + 5);
    return r.map((b, i) => ({
      x: 12 + b.x * 0.76,
      y: 10 + b.y * 0.8,
      s: 240 + b.r * 130 + i * 40,
      o: 0.1 + b.o * 0.14,
    }));
  }, [index]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* gradiente base, com troca suave entre slides */}
      <AnimatePresence>
        <motion.div
          key={`grad-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
          className="absolute inset-0"
          style={{ background: `linear-gradient(${angle}deg, ${grad[0]}, ${grad[1]})` }}
        />
      </AnimatePresence>

      {/* bolhas que se reposicionam a cada slide */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white blur-3xl"
          style={{ width: b.s, height: b.s }}
          animate={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            opacity: b.o,
            scale: reduced ? 1 : [1, 1.12, 1],
          }}
          transition={{
            left: { type: "spring", stiffness: 42, damping: 18 },
            top: { type: "spring", stiffness: 42, damping: 18 },
            opacity: { duration: 0.9 },
            scale: { duration: 9 + i * 3, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {/* sombra inferior, para o texto sempre ter contraste */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />

      {/* luz que atravessa na entrada de cada slide */}
      {!reduced && (
        <AnimatePresence>
          <motion.div
            key={`sweep-${index}`}
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "120%", opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: EASE_OUT }}
            className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent blur-2xl"
          />
        </AnimatePresence>
      )}

      {/* vinheta */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.3) 100%)" }}
      />
    </div>
  );
}

/* ────────────────────────── Fundos animados ────────────────────────── */

export type Ambience = "stars" | "hearts" | "bokeh" | "confetti" | "aurora" | "none";

/**
 * Camada de fundo do slide. Fica atrás do conteúdo e não captura toque.
 * As posições vêm de uma semente fixa para não "pular" a cada re-render.
 */
export function SlideAmbience({ kind, seed = 3 }: { kind: Ambience; seed?: number }) {
  const bits = useMemo(() => starField(kind === "stars" ? 60 : 18, seed), [kind, seed]);
  if (kind === "none") return null;

  if (kind === "stars") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          {bits.map((s, i) => (
            <motion.circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r * 0.22}
              fill="white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [s.o * 0.25, s.o, s.o * 0.25] }}
              transition={{ duration: 2 + (i % 5) * 0.6, repeat: Infinity, delay: (i % 11) * 0.19 }}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (kind === "hearts") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bits.map((s, i) => (
          <motion.span
            key={i}
            className="absolute select-none"
            style={{ left: `${s.x}%`, fontSize: 10 + s.r * 9, opacity: s.o * 0.5 }}
            initial={{ y: "108%", rotate: -18 }}
            animate={{ y: "-18%", rotate: 18 }}
            transition={{
              duration: 9 + (i % 6) * 2.2,
              repeat: Infinity,
              delay: (i % 9) * 0.9,
              ease: "linear",
            }}
          >
            {i % 3 === 0 ? "💜" : i % 3 === 1 ? "💗" : "✨"}
          </motion.span>
        ))}
      </div>
    );
  }

  if (kind === "bokeh") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bits.slice(0, 12).map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white blur-xl"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 40 + s.r * 46,
              height: 40 + s.r * 46,
              opacity: s.o * 0.18,
            }}
            animate={{ scale: [1, 1.25, 1], x: [0, 14, 0], y: [0, -18, 0] }}
            transition={{ duration: 8 + (i % 5) * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}
      </div>
    );
  }

  if (kind === "aurora") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-x-[-20%] h-[45%] rounded-[50%] blur-3xl"
            style={{
              top: `${8 + i * 26}%`,
              background: `rgba(255,255,255,${0.13 - i * 0.03})`,
            }}
            animate={{ x: ["-8%", "8%", "-8%"], scaleY: [1, 1.25, 1] }}
            transition={{ duration: 11 + i * 3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  // confetti
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {starField(46, seed).map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[1px]"
          style={{
            left: `${s.x}%`,
            width: 4 + s.r * 3,
            height: 8 + s.r * 5,
            background: ["#FFD766", "#F4726A", "#9575E8", "#8FE3C8", "#fff"][i % 5],
            opacity: 0.85,
          }}
          initial={{ y: "-15%", rotate: 0 }}
          animate={{ y: "115%", rotate: 540 }}
          transition={{
            duration: 3.4 + (i % 7) * 0.7,
            repeat: Infinity,
            delay: (i % 13) * 0.28,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────── Tipografia animada ────────────────────────── */

/**
 * Título que entra palavra por palavra, como o Wrapped do Spotify.
 * Palavra é a unidade certa: letra por letra fica lento e ilegível em frases,
 * e de uma vez não tem graça.
 */
export function RevealTitle({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useHydrationSafeReducedMotion();
  const words = text.split(" ");
  if (reduced) return <h2 className={className}>{text}</h2>;
  return (
    <h2 className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0, rotate: 4 }}
            animate={{ y: "0%", opacity: 1, rotate: 0 }}
            transition={{ delay: delay + i * 0.075, duration: 0.55, ease: EASE_OUT }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </h2>
  );
}

/**
 * Número que "roda" até o valor final. Usado nos grandes números da
 * retrospectiva — dá peso ao dado em vez de só mostrá-lo.
 */
export function CountUp({
  value,
  className,
  delay = 0,
  duration = 1.1,
}: {
  value: string;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reduced = useHydrationSafeReducedMotion();
  // Só conta se for realmente um número (aceita "1.234" e "Nv 7").
  const numeric = value.replace(/[^\d]/g, "");
  const prefix = value.slice(0, value.indexOf(numeric[0] ?? "") === -1 ? 0 : value.indexOf(numeric[0]));
  const target = Number(numeric);
  const [shown, setShown] = useState(reduced || !numeric ? target : 0);

  useEffect(() => {
    if (reduced || !numeric || !Number.isFinite(target)) return;
    let raf = 0;
    const startAt = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / (duration * 1000)));
      // desacelera no fim
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, numeric, delay, duration, reduced]);

  if (!numeric) return <div className={className}>{value}</div>;
  return (
    <div className={className}>
      {prefix}
      {shown.toLocaleString("pt-BR")}
    </div>
  );
}

/* ────────────────────────── Perguntas em balões ────────────────────────── */
