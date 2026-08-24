export const CREME = "#F6E7D2";
export const CREME_ESCURO = "#E6D2B6";
export const PONTA = "#4B3A30"; // seal point
export const PONTA_ESCURA = "#382A22";
export const ROSA = "#EFA3A8";
export const OLHO = "#39ADE6";
export const OLHO_CLARO = "#8FD8F5";

export type Acao = "parado" | "alongar" | "pular" | "lamber" | "olhar" | "ronronar" | "sacudir";

/** Quanto tempo cada ação dura, em ms. */
export const DURACAO: Record<Acao, number> = {
  parado: 0,
  alongar: 1500,
  pular: 1000,
  lamber: 1800,
  olhar: 1600,
  ronronar: 1600,
  sacudir: 900,
};
