"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/nucleo/movimento";
import type { FotoRetrospectiva } from "./tipos";

/* ── Molduras ── */

export function Polaroide({
  src,
  caption,
  rotate = 0,
  delay = 0,
  size = 260,
  kenBurns = false,
  alt = "",
}: {
  src: string;
  caption?: string | null;
  rotate?: number;
  delay?: number;
  size?: number;
  kenBurns?: boolean;
  alt?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: rotate - 10, y: 30 }}
      animate={{ opacity: 1, scale: 1, rotate, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 18 }}
      className="bg-white p-2.5 pb-8 shadow-2xl"
      style={{ width: size, borderRadius: 4 }}
    >
      <div className="overflow-hidden bg-black/10" style={{ height: size * 0.92 }}>
        <motion.img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          animate={kenBurns ? { scale: [1, 1.14], x: [0, -8], y: [0, -6] } : {}}
          transition={kenBurns ? { duration: 6, ease: "easeOut" } : {}}
        />
      </div>
      {caption && (
        <div
          className="mt-1.5 truncate px-1 text-center text-[13px] text-neutral-700"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {caption}
        </div>
      )}
    </motion.div>
  );
}

export function Colagem({ photos }: { photos: FotoRetrospectiva[] }) {
  // posições espalhadas, estilo mural de fotos
  const spots = [
    { x: -96, y: -150, r: -8, s: 168 },
    { x: 92, y: -128, r: 7, s: 152 },
    { x: -110, y: 34, r: 5, s: 156 },
    { x: 86, y: 52, r: -6, s: 172 },
    { x: -18, y: -20, r: -2, s: 186 },
    { x: -84, y: 210, r: 9, s: 144 },
    { x: 96, y: 226, r: -9, s: 150 },
  ];
  // A colagem tem uma composição fixa de 440px de altura. Em telas baixas, o
  // palco encolhe (altura real, para não estourar a tela) e o conteúdo é
  // reduzido por escala na mesma proporção, preservando o arranjo.
  return (
    <div className="relative h-[min(440px,46vh)] w-full">
      {/* Faixas de altura SEM sobreposição, de propósito: o Tailwind emite as
          media queries em ordem crescente (certo para `min-width`, errado para
          `max-height`), então queries sobrepostas fariam a maior vencer numa
          tela pequena. Com faixas fechadas, só uma casa por vez. */}
      <div
        className="absolute inset-0 origin-center
          [@media(max-height:960px)_and_(min-height:821px)]:scale-[0.84]
          [@media(max-height:820px)_and_(min-height:701px)]:scale-[0.72]
          [@media(max-height:700px)_and_(min-height:601px)]:scale-[0.6]
          [@media(max-height:600px)]:scale-[0.5]"
      >
        {photos.slice(0, spots.length).map((p, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(calc(-50% + ${spots[i].x}px), calc(-50% + ${spots[i].y}px))` }}
          >
            <Polaroide src={p.url} rotate={spots[i].r} delay={0.18 + i * 0.13} size={spots[i].s} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Mural({ photos }: { photos: FotoRetrospectiva[] }) {
  // Mais fotos = mais colunas, para o mural crescer para o lado em vez de
  // empilhar linhas e estourar a altura da tela.
  const cols = photos.length > 12 ? 5 : photos.length > 6 ? 4 : 3;
  return (
    <div
      className="w-full"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}
    >
      {photos.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6, rotate: (i % 3 - 1) * 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 16 }}
          className="overflow-hidden rounded-lg bg-white/15"
          style={{ aspectRatio: "1" }}
        >
          <img src={p.url} alt="" className="h-full w-full object-cover" />
        </motion.div>
      ))}
    </div>
  );
}

export function TiraDeFilme({ photos }: { photos: FotoRetrospectiva[] }) {
  const row1 = photos.slice(0, Math.ceil(photos.length / 2));
  const row2 = photos.slice(Math.ceil(photos.length / 2));
  const Strip = ({ items, dir }: { items: FotoRetrospectiva[]; dir: 1 | -1 }) => (
    <div className="relative overflow-hidden rounded-lg bg-black/35 py-2">
      <motion.div
        className="flex gap-2 px-2"
        animate={{ x: dir === 1 ? [0, -260] : [-260, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((p, i) => (
          <div key={i} className="shrink-0 border-2 border-white/85 bg-white/10" style={{ width: 104, height: 104 }}>
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </motion.div>
      {/* furos da película */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mt-0.5 h-1.5 w-2.5 rounded-[1px] bg-white/70" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-around">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mb-0.5 h-1.5 w-2.5 rounded-[1px] bg-white/70" />
        ))}
      </div>
    </div>
  );
  return (
    <div className="w-full space-y-3">
      <Strip items={row1} dir={1} />
      {row2.length > 0 && <Strip items={row2} dir={-1} />}
    </div>
  );
}

/**
 * Revela a palavra secreta do casal letra por letra, no estilo Wordle:
 * as peças viram e ficam verdes uma depois da outra.
 */
