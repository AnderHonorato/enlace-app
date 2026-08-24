// Utilidades pequenas e puras compartilhadas pelos redutores de jogo.
// Sem "server-only": sao funcoes puras, seguras de importar tanto nas
// rotas de API quanto (se um dia precisar) em componentes de cliente.

// Faixa Unicode dos sinais diacríticos combinantes (U+0300–U+036F), construída
// por código em vez de caractere literal para não depender da codificação do
// arquivo-fonte em diferentes editores/terminais.
const ACCENT_MARKS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

/** Remove acentos, pontuacao e caixa - para comparar respostas de forma tolerante. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(ACCENT_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compara duas frases por sobreposicao de palavras (0 a 1). Simples de proposito. */
export function similaridade(a: string, b: string): number {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na || !nb) return 0;
  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = new Set(nb.split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  return common / Math.max(ta.size, tb.size);
}

/** Embaralha uma copia do array (Fisher-Yates). So usar no servidor. */
export function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sortItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Lancado por um redutor quando a jogada e invalida - vira 400 na rota. */
export class MoveError extends Error {}

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
