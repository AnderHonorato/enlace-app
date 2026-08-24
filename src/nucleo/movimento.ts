// Vocabulário de animação do Enlace.
// Tudo que se move no app usa uma destas curvas — é isso que faz a interface
// parecer uma coisa só em vez de várias animações soltas.

import type { TargetAndTransition, Transition, Variants } from "framer-motion";

/** Curva padrão: sai rápido, chega devagar. Boa para entradas e saídas. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** Curva simétrica, para movimentos que voltam ao ponto de partida. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];
/** Leve overshoot — dá um "puxão" gostoso em selos e emblemas. */
export const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const spring = {
  /** Menus, popovers, painéis: responde na hora. */
  snappy: { type: "spring", stiffness: 380, damping: 30, mass: 0.7 } as Transition,
  /** Cards e listas: presente, mas sem exagero. */
  soft: { type: "spring", stiffness: 220, damping: 26 } as Transition,
  /** Emojis, contadores, medalhas: quica um pouco. */
  bouncy: { type: "spring", stiffness: 500, damping: 16, mass: 0.6 } as Transition,
  /** Elementos grandes entrando em cena (slides da retrospectiva). */
  gentle: { type: "spring", stiffness: 130, damping: 20 } as Transition,
} as const;

export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.55,
  cinematic: 0.9,
} as const;

/** Sobe e aparece. O gesto de entrada mais usado do app. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -10, transition: { duration: duration.fast, ease: EASE_OUT } },
};

/** Aparece crescendo do centro. Para diálogos e lightboxes. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.fast } },
};

/**
 * Item de lista com atraso em cascata pelo índice.
 * Use `custom={i}` no elemento. O atraso é limitado para que listas longas
 * não fiquem esperando meio segundo para terminar de aparecer.
 */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: EASE_OUT, delay: Math.min(i, 8) * 0.045 },
  }),
  exit: { opacity: 0, x: -12, transition: { duration: duration.fast } },
};

/** Container que orquestra a cascata dos filhos (alternativa ao `custom`). */
export const stagger = (gap = 0.05, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Abre/fecha em altura — para painéis de comentários e filtros. */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: "auto", opacity: 1, transition: { duration: duration.base, ease: EASE_OUT } },
  exit: { height: 0, opacity: 0, transition: { duration: duration.fast, ease: EASE_OUT } },
};

/**
 * Laço infinito (halos, selos "ao vivo", pontinhos pulsantes) já com a decisão
 * de "reduzir movimento" embutida.
 *
 * Existe porque o `@media (prefers-reduced-motion)` do globals.css NÃO alcança
 * o framer-motion: ele anima por JS, escrevendo `style` inline, e passa por
 * cima do CSS. Hoje há 66 usos de `repeat: Infinity` espalhados em 29
 * componentes e a maioria ignora a preferência do usuário.
 *
 * Passe o resultado de `useReducedMotion()` como segundo argumento e emparelhe
 * com um `animate` estático nesse caso — o laço simplesmente não roda.
 */
export const loop = (transition: Transition, reduced?: boolean | null): Transition =>
  reduced ? { duration: 0 } : { repeat: Infinity, ...transition };

/** Feedback de toque padrão em botões. */
export const tap = { scale: 0.96 } as const;
/** Realce de hover padrão. */
export const hoverLift = { y: -2, scale: 1.015 } as const;

/**
 * Pulso de coração — a animação de curtir.
 * Usada em memórias e em comentários para que os dois gestos sejam iguais.
 */
export const heartBeat: TargetAndTransition = {
  scale: [1, 1.45, 0.92, 1.12, 1],
  transition: { duration: 0.5, ease: EASE_OUT },
};
