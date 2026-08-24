// Coreografia da retrospectiva.
//
// A retrospectiva conta uma história — e história tem ritmo e continuidade.
// Antes, todo slide entrava igual e durava quase o mesmo tempo: isso é o que
// fazia a sequência parecer apresentação de slides. Aqui ficam as três
// decisões que resolvem isso, separadas do componente porque são regras de
// narrativa, não de layout:
//
//   1. PAPEL  — o que aquele slide é dentro da história. Dele saem ritmo e gesto.
//   2. GESTO  — como o slide CHEGA. Cinco gestos nomeados, um por família.
//               Variedade na chegada, unidade na saída: é isso que faz parecer
//               uma linguagem só, em vez de um catálogo de transições.
//   3. ELO    — as poucas passagens em que um elemento ATRAVESSA a troca de
//               slide (`layoutId`). Onde existe elo, os dois slides apenas
//               dissolvem: o olho precisa seguir uma coisa se movendo, não três.

import type { TargetAndTransition, Transition, Variants } from "framer-motion";
import { EASE_IN_OUT, EASE_OUT, duration, spring } from "@/nucleo/movimento";

/** O mínimo que a coreografia precisa saber de um slide (evita import circular). */
export type SlideShape = { key: string; layout?: string; ms?: number };

/* ─────────────────────────── 1. Papel narrativo ─────────────────────────── */

export type SlideRole =
  | "abertura"
  | "revelacao"
  | "dado"
  | "galeria"
  | "cena"
  | "brincadeira"
  | "interativo"
  | "fecho";

/** Slides que são momento, não estatística — mesmo quando têm foto. */
const REVELACAO = new Set(["met-date", "anniversary", "first-entry", "top", "level", "mood"]);
/** Layouts que montam uma cena própria e têm animação interna longa. */
const CENA = new Set(["starmap", "moon", "counter", "timeline", "places", "achievements"]);
/** Layouts que são fotografia: pedem tempo de olhar. */
const GALERIA = new Set(["collage", "mural", "filmstrip", "polaroid"]);
/** Brincadeiras com animação própria demorada (a roleta leva 2,6s só para parar). */
const BRINCADEIRA = new Set(["wordle", "roleta"]);

/**
 * O papel vem primeiro da chave (o slide sabe o que ele significa) e só depois
 * do layout. Por isso "a primeira memória" e "a memória mais amada" são
 * revelação, e não galeria, mesmo desenhando uma polaroid.
 */
export function roleOf(s: SlideShape): SlideRole {
  if (s.key === "intro") return "abertura";
  if (s.key === "end") return "fecho";
  if (s.key === "questions") return "interativo";
  if (REVELACAO.has(s.key)) return "revelacao";
  const l = s.layout ?? "text";
  if (BRINCADEIRA.has(l)) return "brincadeira";
  if (CENA.has(l)) return "cena";
  if (GALERIA.has(l)) return "galeria";
  return "dado";
}

/* ──────────────────────────────── 2. Ritmo ──────────────────────────────── */

/**
 * Quanto tempo cada papel fica no ar. Não é preferência: é a batida da
 * história. A abertura respira, a sequência de números é percussão, a
 * revelação precisa de silêncio antes e depois, a cena precisa terminar de
 * se desenhar.
 */
export const BEAT: Record<SlideRole, number> = {
  /** Entrar na história devagar: o nome do casal fica no ar antes de qualquer dado. */
  abertura: 6000,
  /** O momento tem que pousar. Rápido demais e vira estatística. */
  revelacao: 6600,
  /** Percussão: entra, marca, sai. É o contraste com a revelação que cria ritmo. */
  dado: 4200,
  /** Foto pede olhar — mas não pede análise. */
  galeria: 5800,
  /** Mapa estelar, lua, contador, jornada e conquistas terminam de se desenhar por volta dos 2s. */
  cena: 8200,
  /** A roleta gira 2,6s antes do resultado; o wordle revela letra a letra. */
  brincadeira: 9000,
  /** Pausa automaticamente, mas se o casal despausar precisa de tempo para responder. */
  interativo: 9000,
  /** O último slide não avança sozinho — o valor aqui é só para o penúltimo respirar. */
  fecho: 7000,
};

/** Duração real do slide: o `ms` explícito ganha, senão vale a batida do papel. */
export function durationOf(s: SlideShape): number {
  return s.ms ?? BEAT[roleOf(s)];
}

/* ─────────────────────────────── 3. Gestos ──────────────────────────────── */

/**
 * Cinco gestos de chegada. Poucos de propósito: consistência é identidade,
 * variedade infinita é ruído.
 *
 * - `cortina`  abertura e fecho — a tela se assenta, sem lado nenhum.
 * - `assentar` revelações — vem de baixo, com peso, e para.
 * - `avancar`  dados — passo lateral seco, como quem vira a página de um relatório.
 * - `folhear`  fotos — entra torto e endireita, como foto tirada da caixa.
 * - `focar`    cenas — aproxima, como quem ajusta o foco em algo distante.
 * - `elo`      passagens com elemento atravessando — só dissolve (ver ELOS).
 */
export type Gesture = "cortina" | "assentar" | "avancar" | "folhear" | "focar" | "elo";

const GESTO_POR_PAPEL: Record<SlideRole, Gesture> = {
  abertura: "cortina",
  fecho: "cortina",
  revelacao: "assentar",
  dado: "avancar",
  galeria: "folhear",
  cena: "focar",
  brincadeira: "focar",
  interativo: "avancar",
};

export function gestureOf(role: SlideRole): Gesture {
  return GESTO_POR_PAPEL[role];
}

/**
 * Saída padrão de quase todo slide: recua um passo e some, na direção contrária
 * à entrada do próximo. É curta de propósito (0,34s contra 0,42–0,9s da
 * entrada) — o que sai tem que liberar a cena antes de o que entra terminar de
 * chegar. É essa diferença que cria sobreposição em vez de troca.
 */
const recuo = (d: number): TargetAndTransition => ({
  opacity: 0,
  x: d * -26,
  y: -8,
  scale: 0.97,
  rotate: 0,
  transition: { duration: 0.34, ease: EASE_OUT },
});

const parado = { opacity: 0, x: 0, y: 0, scale: 1, rotate: 0 } as const;

type GestoDef = {
  entrada: (d: number) => TargetAndTransition;
  chegada: Transition;
  saida: (d: number) => TargetAndTransition;
};

const GESTOS: Record<Gesture, GestoDef> = {
  cortina: {
    entrada: () => ({ ...parado, scale: 1.05 }),
    chegada: { duration: duration.cinematic, ease: EASE_OUT },
    // A cortina não recua para o lado: ela fecha onde está.
    saida: () => ({ ...parado, scale: 1.03, transition: { duration: duration.slow, ease: EASE_OUT } }),
  },
  assentar: {
    entrada: () => ({ ...parado, y: 42, scale: 0.96 }),
    chegada: { ...spring.gentle, opacity: { duration: 0.5, ease: EASE_OUT } },
    saida: recuo,
  },
  avancar: {
    entrada: (d) => ({ ...parado, x: d * 54 }),
    chegada: { duration: 0.42, ease: EASE_OUT },
    saida: recuo,
  },
  folhear: {
    entrada: (d) => ({ ...parado, x: d * 40, y: 10, scale: 0.94, rotate: d * -2.5 }),
    chegada: { ...spring.soft, opacity: { duration: 0.4, ease: EASE_OUT } },
    saida: recuo,
  },
  focar: {
    entrada: () => ({ ...parado, y: 20, scale: 0.9 }),
    chegada: { duration: 0.75, ease: EASE_OUT },
    saida: recuo,
  },
  elo: {
    // Nada se move: quem se move é o elemento que atravessa.
    entrada: () => ({ ...parado }),
    chegada: { duration: 0.45, ease: EASE_IN_OUT },
    saida: () => ({ ...parado, transition: { duration: 0.32, ease: EASE_IN_OUT } }),
  },
};

/**
 * Variantes do slide. Entrada e saída são escolhidas separadamente porque uma
 * passagem com elo dissolve os dois lados, mesmo que o slide seja de outra
 * família.
 *
 * Só `transform` e `opacity` — nada de `filter: blur`, que era o que pesava a
 * transição antiga no celular.
 */
export function slideVariants(entrada: Gesture, saida: Gesture, reduced: boolean): Variants {
  if (reduced) {
    // Movimento reduzido: a história continua inteira, só sem deslocamento.
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: { duration: duration.base, ease: EASE_OUT } },
      exit: { opacity: 0, transition: { duration: duration.fast, ease: EASE_OUT } },
    };
  }
  const e = GESTOS[entrada];
  const s = GESTOS[saida];
  return {
    enter: (d: number) => e.entrada(d),
    center: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, transition: e.chegada },
    exit: (d: number) => s.saida(d),
  };
}

/* ──────────────────────────────── 4. Elos ───────────────────────────────── */

/** Onde, dentro do slide, o elemento que atravessa mora. */
export type EloSlot = "numero" | "disco" | "rotulo" | "unidade";

type Elo = {
  id: string;
  de: string;
  para: string;
  slotDe: EloSlot;
  slotPara: EloSlot;
  /** Por que esse vínculo é verdadeiro — se não der para escrever isso, o elo não deve existir. */
  porque: string;
};

/**
 * Poucas passagens, todas semanticamente verdadeiras. O elo só acende quando os
 * dois slides ficam mesmo lado a lado (depende dos dados do casal), então a
 * lista pode declarar pares que nem sempre existem.
 */
const ELOS: Elo[] = [
  {
    id: "elo-data",
    de: "met-date",
    para: "starmap-met",
    slotDe: "numero",
    slotPara: "rotulo",
    porque: "o dia em que se conheceram vira a legenda do céu daquele dia",
  },
  {
    id: "elo-ceu",
    de: "starmap-met",
    para: "moon-met",
    slotDe: "disco",
    slotPara: "disco",
    porque: "o disco do céu encolhe e vira a lua daquela noite",
  },
  {
    id: "elo-dias",
    de: "anniversary",
    para: "counter",
    slotDe: "numero",
    slotPara: "unidade",
    porque: "a data do início vira a contagem de dias que corre desde ela",
  },
  {
    id: "elo-numero",
    de: "total",
    para: "words",
    slotDe: "numero",
    slotPara: "numero",
    porque: "as memórias viram palavras: é o mesmo número mudando de unidade",
  },
  {
    id: "elo-contagem",
    de: "month",
    para: "authors",
    slotDe: "numero",
    slotPara: "numero",
    porque: "a contagem continua — de quando escreveram para quem escreveu",
  },
];

export type EloState = {
  /** layoutId por slot deste slide (vazio quando não há elo ativo). */
  slots: Partial<Record<EloSlot, string>>;
  /** Existe elo vindo do slide anterior. */
  entrando: boolean;
  /** Existe elo indo para o próximo slide. */
  saindo: boolean;
};

const VAZIO: EloState = { slots: {}, entrando: false, saindo: false };

/** Elos ativos do slide atual, olhando o vizinho de trás e o da frente. */
export function elosFor(prev: string | undefined, cur: string, next: string | undefined): EloState {
  const entra = ELOS.find((e) => e.de === prev && e.para === cur);
  const sai = ELOS.find((e) => e.de === cur && e.para === next);
  if (!entra && !sai) return VAZIO;
  const slots: Partial<Record<EloSlot, string>> = {};
  if (entra) slots[entra.slotPara] = entra.id;
  if (sai) slots[sai.slotDe] = sai.id;
  return { slots, entrando: !!entra, saindo: !!sai };
}

/**
 * Curva do elemento que atravessa. Simétrica porque ele sai de um repouso e
 * chega em outro — não é uma entrada, é um deslocamento.
 */
export const ELO_LAYOUT: Transition = { duration: 0.62, ease: EASE_IN_OUT };

/* ─────────────────────── 5. Revelação do número grande ─────────────────── */

/**
 * O momento em que um número grande aparece, em quadros-chave.
 *
 *   0    → 0,29s : NADA acontece. O rótulo já está lá e o número ainda não —
 *                  essa espera é a antecipação, é ela que dá importância ao dado.
 *   0,29 → 0,65s : o número chega, subindo.
 *   0,65 → 1,33s : a contagem corre (CountUp) e a escala cresce de leve junto.
 *   1,33 → 1,55s : assenta. O pequeno recuo de escala é o peso do número parando.
 *
 * Os tempos do CountUp abaixo são casados com esses quadros — mexer em um pede
 * mexer no outro.
 */
export const BIG_REVEAL = {
  duracao: 1.55,
  times: [0, 0.19, 0.42, 0.86, 1],
  opacity: [0, 0, 1, 1, 1],
  y: [14, 14, 0, 0, 0],
  scale: [0.86, 0.86, 1, 1.03, 1],
  /** Quando a contagem começa e quanto ela dura (bate com o quadro 0,65 → 1,33s). */
  contagemDelay: 0.42,
  contagemDuracao: 0.9,
} as const;
