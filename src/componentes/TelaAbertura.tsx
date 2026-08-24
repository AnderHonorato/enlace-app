"use client";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, EASE_BACK, duration } from "@/nucleo/movimento";

/**
 * Mesmo path dos dois corações do HeartMark (src/componentes/Logo.tsx).
 * Copiado aqui porque a splash precisa animar cada coração de forma
 * independente enquanto eles se encontram — o SVG estático do Logo os
 * desenha como uma composição só, sem espaço para uma entrada separada.
 */
const HEART_PATH =
  "M16 29 C16 29 2 20 2 10 C2 4 6 2 9 2 C12 2 15 4 16 7 C17 4 20 2 23 2 C26 2 30 4 30 10 C30 20 16 29 16 29 Z";

const CHAVE_ARMAZENAMENTO = "enlace-splash";
const CHAVE_ANTIGA = "enlace-splash-v2";

const ROTAS_INICIAIS = ["/app", "/app/novo", "/app/conversa", "/app/album", "/app/jogos"];
const ROTAS_EM_SEGUNDO_PLANO = [
  "/app/nos",
  "/app/bichinho",
  "/app/tarefas",
  "/app/planos",
  "/app/mapa",
  "/app/ao-vivo",
  "/app/livro",
  "/app/radio",
  "/app/retrospectiva",
  "/app/config",
];

// Storyboard (movimento normal): 0–560ms os corações se encontram e se
// sobrepõem (com um leve puxão via EASE_BACK ao encaixar), ~200ms de pausa
// com a marca formada, depois ~370ms de saída. Total ~1150ms.
const HOLD_MS = 780;
const EXIT_MS = 370;
// Com prefers-reduced-motion: marca já estática, ~350ms de pausa e saída em fade simples.
const REDUCED_HOLD_MS = 350;
const REDUCED_EXIT_MS = 250;

/**
 * Tela de abertura do Enlace: os dois corações da marca chegam de lados
 * opostos e se sobrepõem — a metáfora do "enlace" em movimento. Aparece
 * uma vez por instalação/navegador (localStorage) e nunca atrasa o app: o conteúdo real
 * já está montado por baixo desde o primeiro frame.
 */
export function TelaAbertura() {
  const roteador = useRouter();
  const prefersReduced = useReducedMotion();
  const [stage, setStage] = useState<"enter" | "exit" | "done">("enter");
  const gradId = useId();

  useEffect(() => {
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conexao?.saveData || conexao?.effectiveType?.includes("2g")) return;

    ROTAS_INICIAIS.forEach((rota) => roteador.prefetch(rota));
    const prepararRestante = () => ROTAS_EM_SEGUNDO_PLANO.forEach((rota) => roteador.prefetch(rota));
    const navegador = window as Window & {
      requestIdleCallback?: (acao: () => void, opcoes?: { timeout: number }) => number;
      cancelIdleCallback?: (identificador: number) => void;
    };
    const identificador = navegador.requestIdleCallback
      ? navegador.requestIdleCallback(prepararRestante, { timeout: 4_000 })
      : window.setTimeout(prepararRestante, 2_000);

    return () => {
      if (navegador.cancelIdleCallback) navegador.cancelIdleCallback(identificador);
      else window.clearTimeout(identificador);
    };
  }, [roteador]);

  useEffect(() => {
    // O <script> inline no <head> (layout.tsx) já escondeu o overlay via CSS
    // antes da primeira pintura se a sessão já viu a splash — aqui só
    // evitamos gastar um ciclo de animação com algo que ninguém vai ver.
    let seen = false;
    try {
      seen = localStorage.getItem(CHAVE_ARMAZENAMENTO) === "1" || localStorage.getItem(CHAVE_ANTIGA) === "1";
    } catch {}
    if (seen) {
      setStage("done");
      return;
    }
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, "1");
    } catch {}

    const hold = prefersReduced ? REDUCED_HOLD_MS : HOLD_MS;
    const exit = prefersReduced ? REDUCED_EXIT_MS : EXIT_MS;
    const toExit = setTimeout(() => setStage("exit"), hold);
    const toDone = setTimeout(() => setStage("done"), hold + exit);
    return () => {
      clearTimeout(toExit);
      clearTimeout(toDone);
    };
  }, [prefersReduced]);

  if (stage === "done") return null;

  const exiting = stage === "exit";
  const exitSeconds = (prefersReduced ? REDUCED_EXIT_MS : EXIT_MS) / 1000;

  return (
    <motion.div
      id="enlace-splash"
      role="status"
      aria-label="Carregando o Enlace"
      className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center bg-bg"
      initial={false}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exitSeconds, ease: EASE_OUT }}
      style={{ willChange: "opacity" }}
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={false}
        animate={
          exiting
            ? { opacity: 0, y: prefersReduced ? 0 : -6, scale: prefersReduced ? 1 : 1.05 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: exitSeconds, ease: EASE_OUT }}
        style={{ willChange: "transform, opacity" }}
      >
        <svg viewBox="0 0 60 44" width={64} height={64} aria-hidden>
          <defs>
            {/* Tinta, não carmim: a marca em si é o traço de tinta do papel;
                o carmim fica reservado para o wordmark logo abaixo. */}
            <linearGradient id={`${gradId}-a`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(var(--text-2))" />
              <stop offset="1" stopColor="rgb(var(--text))" />
            </linearGradient>
          </defs>
          {/* Coração esquerdo: chega da esquerda com um leve puxão ao encaixar. */}
          <motion.g
            initial={prefersReduced ? false : { x: -46, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={prefersReduced ? { duration: 0.12 } : { duration: duration.slow, ease: EASE_BACK }}
          >
            <g transform="translate(1,7) scale(0.95)">
              <path fill={`url(#${gradId}-a)`} d={HEART_PATH} />
            </g>
          </motion.g>
          {/* Coração direito: espelhado, chega da direita e se mescla ("multiply", tinta sobre tinta) ao encontrar o outro. */}
          <motion.g
            initial={prefersReduced ? false : { x: 46, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={prefersReduced ? { duration: 0.12 } : { duration: duration.slow, ease: EASE_BACK }}
            style={{ mixBlendMode: "multiply" }}
          >
            <g transform="translate(28,7) scale(0.95)">
              <path fill="rgb(var(--text))" opacity={0.9} d={HEART_PATH} />
            </g>
          </motion.g>
        </svg>
        <motion.span
          className="font-display text-2xl leading-none gradient-text"
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReduced ? { duration: 0.12 } : { duration: duration.base, ease: EASE_OUT, delay: 0.26 }
          }
        >
          Enlace
        </motion.span>
        <div className="mt-1 h-px w-28 overflow-hidden bg-border2" aria-hidden>
          <motion.span
            className="block h-full bg-accent"
            initial={prefersReduced ? { width: "100%" } : { width: "8%", x: "-100%" }}
            animate={prefersReduced ? { width: "100%" } : { width: "100%", x: "0%" }}
            transition={{ duration: prefersReduced ? 0 : 0.72, ease: EASE_OUT }}
          />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          Preparando seu espaço
        </span>
      </motion.div>
    </motion.div>
  );
}
