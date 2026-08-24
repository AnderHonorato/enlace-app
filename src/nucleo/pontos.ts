// Sistema de pontos e "nível de apaixonados" — pontos são infinitos.
// Curva triangular: custo para subir de L → L+1 é 40·L pontos.
// Total para atingir o nível L: 20·L·(L-1).

export function levelFromPoints(points: number): number {
  const p = Math.max(0, points);
  return Math.floor((1 + Math.sqrt(1 + p / 5)) / 2);
}

export function pointsForLevel(level: number): number {
  return 20 * level * (level - 1);
}

export function levelProgress(points: number) {
  const level = levelFromPoints(points);
  const start = pointsForLevel(level);
  const next = pointsForLevel(level + 1);
  const into = points - start;
  const need = next - start;
  return {
    level,
    points,
    into,
    need,
    ratio: need > 0 ? Math.min(1, into / need) : 0,
    toNext: Math.max(0, next - points),
  };
}

const TITLES: { at: number; title: string; emoji: string }[] = [
  { at: 1, title: "Primeiro olhar", emoji: "👀" },
  { at: 2, title: "Flerte", emoji: "😊" },
  { at: 3, title: "Paquera", emoji: "💌" },
  { at: 4, title: "Encantados", emoji: "✨" },
  { at: 5, title: "Namoro firme", emoji: "💞" },
  { at: 7, title: "Apaixonados", emoji: "😍" },
  { at: 10, title: "Inseparáveis", emoji: "🔗" },
  { at: 14, title: "Cúmplices", emoji: "🤝" },
  { at: 20, title: "Almas gêmeas", emoji: "💫" },
  { at: 30, title: "Amor eterno", emoji: "♾️" },
];

export function loveTitle(level: number) {
  let cur = TITLES[0];
  for (const t of TITLES) if (level >= t.at) cur = t;
  return cur;
}

// Pontos-base por ação (usados quando não há análise de IA).
export const POINTS = {
  entryBase: 8,
  entryMood: 2,
  entryPhoto: 3,
  entryLongText: 6,
  comment: 4,
  reaction: 2,
  chat: 2,
};

export function baseEntryPoints(input: {
  contentLength: number;
  hasMood: boolean;
  photos: number;
}): number {
  let p = POINTS.entryBase;
  if (input.hasMood) p += POINTS.entryMood;
  if (input.photos > 0) p += POINTS.entryPhoto;
  if (input.contentLength > 220) p += POINTS.entryLongText;
  return p;
}
