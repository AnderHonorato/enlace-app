"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { MascotState, MascotMood, MascotFeature } from "@/nucleo/mascote";


import { CREME, CREME_ESCURO, DURACAO, OLHO, OLHO_CLARO, PONTA, PONTA_ESCURA, ROSA, type Acao } from "./constantes";

export function Novelo({ reduced, accent, size }: { reduced: boolean; accent: string; size: number }) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -20,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
        }}
      />
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        animate={reduced ? {} : { scale: [1, 1.035, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ overflow: "visible" }}
      >
        <ellipse cx="100" cy="176" rx="52" ry="9" fill="rgba(0,0,0,0.14)" />
        {/* cestinha */}
        <path d="M46 138 Q100 128 154 138 L146 174 Q100 184 54 174 Z" fill="#D9BFA0" />
        <path d="M46 138 Q100 128 154 138 L152 146 Q100 136 48 146 Z" fill="#C9AC8B" />
        {/* gatinho enroladinho */}
        <ellipse cx="100" cy="140" rx="40" ry="27" fill={CREME} />
        <path d="M62 142 Q76 118 100 118 Q124 118 138 142 Q100 152 62 142 Z" fill="#FFF7EC" opacity="0.6" />
        {/* cauda contornando o corpo */}
        <path
          d="M60 142 Q44 150 52 162 Q62 170 76 162"
          fill="none"
          stroke={PONTA}
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* carinha dormindo */}
        <ellipse cx="126" cy="136" rx="22" ry="19" fill={CREME} />
        <ellipse cx="128" cy="140" rx="15" ry="12" fill={PONTA} opacity="0.55" />
        <path d="M112 120 L108 106 L124 118 Z" fill={PONTA} />
        <path d="M140 120 L148 108 L146 124 Z" fill={PONTA} />
        <path d="M120 138 Q124 142 128 138" stroke="#2B211B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M134 138 Q138 142 142 138" stroke="#2B211B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="131" cy="146" rx="3" ry="2.2" fill={ROSA} />
        {/* zzz */}
        {!reduced &&
          [0, 1, 2].map((i) => (
            <motion.text
              key={i}
              x={152 + i * 9}
              y={104 - i * 10}
              fontSize={11 + i * 3}
              fill={accent}
              opacity="0.7"
              animate={{ opacity: [0, 0.8, 0], y: [104 - i * 10, 92 - i * 10, 80 - i * 10] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.6 }}
            >
              z
            </motion.text>
          ))}
      </motion.svg>
    </>
  );
}

/* ── Cauda ───────────────────────────────────────────────────────────────── */
export function Cauda({
  mood,
  acao,
  reduced,
  lendario,
}: {
  mood: MascotMood;
  acao: Acao;
  reduced: boolean;
  lendario: boolean;
}) {
  // Gato feliz balança a cauda mais rápido e mais amplo.
  const animado = mood === "animado" || mood === "radiante";
  const amplitude = acao === "pular" ? 22 : animado ? 15 : 7;
  const velocidade = acao === "pular" ? 0.9 : animado ? 1.4 : 2.6;

  return (
    <motion.g
      animate={reduced ? {} : { rotate: [0, amplitude, -amplitude * 0.6, 0] }}
      transition={{ duration: velocidade, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "138px 152px" }}
    >
      <path
        d="M136 154 Q172 148 176 112 Q177 96 166 94 Q158 93 160 104 Q162 132 132 144 Z"
        fill="url(#gato-ponta)"
      />
      {/* pontinha mais clara, como a cauda de um siamês pega a luz */}
      <path d="M166 94 Q177 96 176 112 Q170 110 166 100 Z" fill="#6B5648" opacity="0.8" />
      {lendario && (
        <motion.circle
          cx="171"
          cy="98"
          r="4"
          fill="#FFE27A"
          animate={reduced ? {} : { opacity: [0.4, 1, 0.4], r: [3, 5, 3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
}

/* ── Patinhas da frente ──────────────────────────────────────────────────── */
export function Patas({ mood, acao, reduced }: { mood: MascotMood; acao: Acao; reduced: boolean }) {
  const feliz = mood === "animado" || mood === "radiante";
  return (
    <>
      {/* esquerda — é a que ele levanta para lamber */}
      <motion.g
        animate={
          reduced
            ? {}
            : acao === "lamber"
              ? { rotate: [0, -46, -46, 0], y: [0, -16, -16, 0] }
              : feliz
                ? { rotate: [0, -9, 0] }
                : {}
        }
        transition={{ duration: acao === "lamber" ? 1.8 : 1.7, repeat: acao === "lamber" ? 0 : Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "62px 132px" }}
      >
        <ellipse cx="60" cy="140" rx="10.5" ry="17" fill="url(#gato-ponta)" transform="rotate(14 60 140)" />
        <ellipse cx="57" cy="152" rx="7" ry="4.5" fill={ROSA} opacity="0.5" />
      </motion.g>

      <motion.g
        animate={reduced ? {} : feliz ? { rotate: [0, 9, 0] } : {}}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "138px 132px" }}
      >
        <ellipse cx="140" cy="140" rx="10.5" ry="17" fill="url(#gato-ponta)" transform="rotate(-14 140 140)" />
        <ellipse cx="143" cy="152" rx="7" ry="4.5" fill={ROSA} opacity="0.5" />
      </motion.g>
    </>
  );
}

/* ── Orelhas ─────────────────────────────────────────────────────────────── */
export function Orelhas({ acao, reduced }: { acao: Acao; reduced: boolean }) {
  const tremer = acao === "sacudir" && !reduced;
  return (
    <>
      <motion.g
        animate={tremer ? { rotate: [0, -13, 9, 0] } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ transformOrigin: "72px 68px" }}
      >
        <path d="M72 70 L58 24 L96 60 Z" fill="url(#gato-ponta)" />
        <path d="M73 66 L64 36 L88 60 Z" fill={ROSA} opacity="0.55" />
      </motion.g>
      <motion.g
        animate={tremer ? { rotate: [0, 13, -9, 0] } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ transformOrigin: "128px 68px" }}
      >
        <path d="M128 70 L142 24 L104 60 Z" fill="url(#gato-ponta)" />
        <path d="M127 66 L136 36 L112 60 Z" fill={ROSA} opacity="0.55" />
      </motion.g>
    </>
  );
}

/* ── Bigodes ─────────────────────────────────────────────────────────────── */
export function Bigodes() {
  const linhas: [number, number, number, number][] = [
    [80, 104, 44, 96],
    [80, 109, 42, 110],
    [80, 114, 46, 124],
    [120, 104, 156, 96],
    [120, 109, 158, 110],
    [120, 114, 154, 124],
  ];
  return (
    <g stroke="#FFF9F0" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
      {linhas.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </g>
  );
}

/* ── Focinho e boca ──────────────────────────────────────────────────────── */
export function Focinho({ acao, reduced }: { acao: Acao; reduced: boolean }) {
  return (
    <g>
      {/* narizinho triangular */}
      <path d="M94 106 L106 106 L100 113 Z" fill={ROSA} />
      <path d="M100 113 L100 118" stroke={PONTA_ESCURA} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      {/* boquinha em w */}
      <path
        d="M100 118 Q94 124 89 118"
        stroke={PONTA_ESCURA}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M100 118 Q106 124 111 118"
        stroke={PONTA_ESCURA}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* linguinha quando está se lambendo */}
      <AnimatePresence>
        {acao === "lamber" && !reduced && (
          <motion.ellipse
            cx="100"
            cy="124"
            rx="5"
            ry="6"
            fill="#F58CA0"
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: [0.2, 1, 0.8, 1] }}
            exit={{ opacity: 0, scaleY: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: "100px 118px" }}
          />
        )}
      </AnimatePresence>
    </g>
  );
}

/* ── Olhos ───────────────────────────────────────────────────────────────── */
export function Olhos({
  mood,
  acao,
  olhar,
  reduced,
}: {
  mood: MascotMood;
  acao: Acao;
  olhar: { x: number; y: number };
  reduced: boolean;
}) {
  const dormindo = mood === "sonolento";
  const triste = mood === "saudade";
  const fechado = dormindo || acao === "lamber";

  // Piscada: rápida e espaçada, como gato de verdade.
  const piscar = reduced ? {} : { scaleY: [1, 1, 0.05, 1, 1] };
  const tPiscar = {
    duration: 5,
    repeat: Infinity,
    times: [0, 0.9, 0.935, 0.97, 1],
    ease: "easeInOut" as const,
  };

  if (fechado) {
    return (
      <g>
        <path d="M72 102 Q84 111 96 102" stroke={PONTA_ESCURA} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M104 102 Q116 111 128 102" stroke={PONTA_ESCURA} strokeWidth="3" strokeLinecap="round" fill="none" />
        {dormindo && !reduced && (
          <motion.text
            x="146"
            y="70"
            fontSize="15"
            fill={PONTA}
            opacity="0.7"
            animate={{ opacity: [0, 1, 0], y: [70, 56, 42] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          >
            z
          </motion.text>
        )}
      </g>
    );
  }

  /** Olho amendoado do siamês, inclinado para cima nos cantos. */
  const Olho = ({ cx, espelho }: { cx: number; espelho: boolean }) => {
    const s = espelho ? -1 : 1;
    return (
      <motion.g animate={piscar} transition={tPiscar} style={{ transformOrigin: `${cx}px 102px` }}>
        <path
          d={`M${cx - 12 * s} 106 Q${cx - 9 * s} 93 ${cx + 1 * s} 92 Q${cx + 12 * s} 92 ${cx + 13 * s} 101 Q${cx + 6 * s} 112 ${cx - 12 * s} 106 Z`}
          fill="url(#gato-olho)"
          stroke={PONTA_ESCURA}
          strokeWidth="1.4"
        />
        {/* pupila fenda, que acompanha o olhar */}
        <motion.g animate={{ x: olhar.x, y: olhar.y }} transition={{ type: "spring", stiffness: 160, damping: 18 }}>
          <ellipse cx={cx} cy="101" rx="3" ry="7.5" fill="#1B2430" />
          <circle cx={cx + 2.6} cy="97" r="2.4" fill="#fff" />
          <circle cx={cx - 3} cy="105" r="1.2" fill="#fff" opacity="0.65" />
        </motion.g>
      </motion.g>
    );
  };

  return (
    <g>
      <Olho cx={84} espelho={false} />
      <Olho cx={116} espelho />
      {triste && (
        <>
          <path d="M72 86 Q82 82 92 86" stroke={PONTA_ESCURA} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M108 86 Q118 82 128 86" stroke={PONTA_ESCURA} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        </>
      )}
      {(mood === "radiante" || mood === "animado") && (
        <>
          <ellipse cx="68" cy="112" rx="9" ry="6" fill={ROSA} opacity="0.4" />
          <ellipse cx="132" cy="112" rx="9" ry="6" fill={ROSA} opacity="0.4" />
        </>
      )}
    </g>
  );
}

/* ── Coleira ─────────────────────────────────────────────────────────────── */
export function Coleira({ accent, lendario }: { accent: string; lendario: boolean }) {
  return (
    <g>
      <path d="M72 122 Q100 136 128 122 L128 130 Q100 144 72 130 Z" fill={accent} opacity="0.92" />
      <circle cx="100" cy="139" r="6.5" fill={lendario ? "#FFD766" : "#F5C542"} stroke="#D9A521" strokeWidth="1.2" />
      <circle cx="98" cy="137" r="1.8" fill="#fff" opacity="0.7" />
    </g>
  );
}

/* ── Aura da fase lendária ───────────────────────────────────────────────── */
export function Aura({ accent, reduced }: { accent: string; reduced: boolean }) {
  return (
    <g>
      <motion.circle
        cx="100"
        cy="120"
        r="76"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.28"
        animate={reduced ? {} : { r: [72, 82, 72], opacity: [0.3, 0.08, 0.3] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI * 2) / 6;
        return (
          <motion.circle
            key={i}
            cx={100 + Math.cos(a) * 74}
            cy={120 + Math.sin(a) * 62}
            r="2.6"
            fill={accent}
            animate={reduced ? {} : { opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35 }}
          />
        );
      })}
    </g>
  );
}

/* ── Acessórios ──────────────────────────────────────────────────────────── */
export function Coroa() {
  return (
    <g transform="translate(100, 30)">
      <path d="M-22 10 L-14 -6 L0 6 L14 -6 L22 10 Z" fill="#F5C542" stroke="#D9A521" strokeWidth="1.5" />
      <circle cx="-14" cy="-6" r="3" fill="#F4726A" />
      <circle cx="0" cy="-10" r="3" fill="#5AA0F0" />
      <circle cx="14" cy="-6" r="3" fill="#4ABEB0" />
    </g>
  );
}

export function Oculos() {
  return (
    <g stroke={PONTA_ESCURA} strokeWidth="2.4" fill="rgba(255,255,255,0.18)">
      <circle cx="84" cy="101" r="14" />
      <circle cx="116" cy="101" r="14" />
      <line x1="98" y1="101" x2="102" y2="101" />
    </g>
  );
}

export function Cachecol() {
  // Dá a volta no pescoço e cai de lado, sem tapar o peito nem a barriga.
  return (
    <g>
      <path d="M70 124 Q100 140 130 124 L130 134 Q100 150 70 134 Z" fill="#E05A5A" />
      <path d="M70 124 Q100 140 130 124 L130 128 Q100 144 70 128 Z" fill="#F07878" opacity="0.7" />
      <path d="M124 136 L136 140 L130 164 L118 159 Z" fill="#E05A5A" />
      <path d="M126 146 L134 149" stroke="#C24A4A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M124 154 L132 157" stroke="#C24A4A" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

export function Flor() {
  return (
    <g transform="translate(132, 46)">
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i * 2 * Math.PI) / 5;
        return <circle key={i} cx={Math.cos(a) * 6} cy={Math.sin(a) * 6} r="4.5" fill="#F4A0C0" />;
      })}
      <circle cx="0" cy="0" r="4" fill="#FFD766" />
    </g>
  );
}

export function Lacinho() {
  return (
    <g transform="translate(100, 28)" fill="#F472B6">
      <path d="M0 0 L-16 -6 L-16 6 Z" />
      <path d="M0 0 L16 -6 L16 6 Z" />
      <circle cx="0" cy="0" r="4" />
    </g>
  );
}

export function Aureola({ reduced }: { reduced: boolean }) {
  return (
    <motion.ellipse
      cx="100"
      cy="18"
      rx="30"
      ry="7.5"
      fill="none"
      stroke="#FFE27A"
      strokeWidth="5"
      animate={reduced ? {} : { opacity: [0.5, 1, 0.5], ry: [7, 8.5, 7] }}
      transition={{ duration: 2.2, repeat: Infinity }}
    />
  );
}

export function Estrelas({ accent, reduced }: { accent: string; reduced: boolean }) {
  const pts = [
    { x: 34, y: 60 },
    { x: 166, y: 66 },
    { x: 46, y: 40 },
    { x: 156, y: 36 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <motion.text
          key={i}
          x={p.x}
          y={p.y}
          fontSize="14"
          fill={accent}
          animate={reduced ? {} : { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
        >
          ✦
        </motion.text>
      ))}
    </>
  );
}

export function Asas({ reduced }: { reduced: boolean }) {
  return (
    <>
      <motion.path
        d="M46 118 Q12 98 16 130 Q38 136 50 122 Z"
        fill="#FFF3DC"
        stroke={CREME_ESCURO}
        strokeWidth="1.2"
        animate={reduced ? {} : { rotate: [0, -7, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "46px 124px" }}
      />
      <motion.path
        d="M154 118 Q188 98 184 130 Q162 136 150 122 Z"
        fill="#FFF3DC"
        stroke={CREME_ESCURO}
        strokeWidth="1.2"
        animate={reduced ? {} : { rotate: [0, 7, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "154px 124px" }}
      />
    </>
  );
}

/** Tipo re-exportado por conveniência para quem só importa o componente. */
