// Regras do quiz, separadas da tela.
//
// Sorteio, embaralhamento, correção e pontuação vivem aqui porque são a parte
// que dá para errar em silêncio — e a parte que precisa continuar valendo
// conforme categorias novas forem entrando. Fora de um componente, dá para
// simular partidas inteiras sem navegador.

import type { Pergunta } from "./tipos";

/** Perguntas sorteadas por partida. */
export const POR_RODADA = 10;

export const XP_ESCOLHA = 20;
export const XP_VF = 15;
export const XP_ORDEM = 30;
/** Pistas valem mais quanto menos pistas forem abertas — daí a escala. */
export const XP_PISTAS_CHEIO = 30;
export const XP_PISTAS_DESCONTO = 8;
export const XP_PISTAS_MINIMO = 12;
export const XP_RODADA_PERFEITA = 50;

/**
 * Pergunta já pronta para a tela.
 *
 * Verdadeiro/falso é modelado como uma múltipla escolha de duas opções: por
 * baixo é a mesma interação, então o motor tem só dois modos de resposta —
 * escolher uma opção ou ordenar itens — em vez de quatro.
 */
export type Preparada = {
  q: Pergunta;
  /** Alternativas na ordem em que aparecem (vazio em perguntas de ordenar). */
  opcoes: string[];
  /** Índice da correta DENTRO de `opcoes` (−1 em perguntas de ordenar). */
  correta: number;
  /** Itens fora de ordem para o jogador reorganizar (só em `ordem`). */
  embaralhados: string[];
};

export function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha garantindo que o resultado não saia já na ordem certa. */
export function desordenar(itens: string[]): string[] {
  if (itens.length < 2) return [...itens];
  let saida = embaralhar(itens);
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    if (saida.some((v, i) => v !== itens[i])) break;
    saida = embaralhar(itens);
  }
  return saida;
}

/**
 * `aleatorio` existe por causa da hidratação: no primeiro render (servidor e
 * cliente) tudo precisa sair igual, então a rodada inicial é determinística e
 * só o efeito de montagem sorteia de verdade.
 */
export function preparar(q: Pergunta, aleatorio: boolean): Preparada {
  if (q.tipo === "vf") {
    return { q, opcoes: ["Verdade", "Mito"], correta: q.verdadeiro ? 0 : 1, embaralhados: [] };
  }
  if (q.tipo === "ordem") {
    return {
      q,
      opcoes: [],
      correta: -1,
      embaralhados: aleatorio ? desordenar(q.itens) : [...q.itens].reverse(),
    };
  }
  if (!aleatorio) return { q, opcoes: q.opcoes, correta: q.correta, embaralhados: [] };
  // Sem isto a resposta certa ficaria sempre na mesma posição em que foi
  // escrita no arquivo de dados — o que vira uma dica involuntária.
  const indices = embaralhar(q.opcoes.map((_, i) => i));
  return {
    q,
    opcoes: indices.map((i) => q.opcoes[i]),
    correta: indices.indexOf(q.correta),
    embaralhados: [],
  };
}

export function montarRodada(perguntas: Pergunta[], aleatorio: boolean): Preparada[] {
  const fonte = aleatorio ? embaralhar(perguntas) : perguntas;
  return fonte.slice(0, POR_RODADA).map((q) => preparar(q, aleatorio));
}

export function xpDaPergunta(q: Pergunta, pistasAbertas: number): number {
  switch (q.tipo) {
    case "vf":
      return XP_VF;
    case "ordem":
      return XP_ORDEM;
    case "pistas":
      return Math.max(XP_PISTAS_MINIMO, XP_PISTAS_CHEIO - XP_PISTAS_DESCONTO * (pistasAbertas - 1));
    default:
      return XP_ESCOLHA;
  }
}

/**
 * Confere uma ordenação montada.
 *
 * `montada` são índices de `item.embaralhados` na sequência em que o jogador
 * tocou; a comparação é por texto contra o gabarito original. Por isso itens
 * repetidos dentro de uma mesma pergunta quebrariam a correção — não use.
 */
export function conferirOrdem(item: Preparada, montada: number[]): boolean {
  if (item.q.tipo !== "ordem") return false;
  const gabarito = item.q.itens;
  if (montada.length !== gabarito.length) return false;
  return montada.every((i, pos) => item.embaralhados[i] === gabarito[pos]);
}

/** Índice, dentro de `embaralhados`, do item que deveria ocupar cada posição. */
export function gabaritoDaOrdem(item: Preparada): number[] {
  if (item.q.tipo !== "ordem") return [];
  return item.q.itens.map((texto) => item.embaralhados.indexOf(texto));
}
