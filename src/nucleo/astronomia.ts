// Cálculos de céu para a retrospectiva: fase da lua, estação do ano e
// constelação da data. Tudo determinístico e local — nenhuma API externa,
// então funciona offline e não custa nada.

export type MoonPhase = {
  /** 0 = lua nova, 0.5 = cheia, ~1 = nova de novo. */
  fraction: number;
  name: string;
  emoji: string;
  /** Quanto do disco está iluminado, de 0 a 1 (para desenhar). */
  illumination: number;
};

const SYNODIC = 29.530588853; // dias de um ciclo lunar completo
// Lua nova de referência: 6 de janeiro de 2000, 18:14 UTC.
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

const PHASES: { max: number; name: string; emoji: string }[] = [
  { max: 0.02, name: "Lua nova", emoji: "🌑" },
  { max: 0.24, name: "Lua crescente", emoji: "🌒" },
  { max: 0.27, name: "Quarto crescente", emoji: "🌓" },
  { max: 0.48, name: "Lua gibosa crescente", emoji: "🌔" },
  { max: 0.53, name: "Lua cheia", emoji: "🌕" },
  { max: 0.74, name: "Lua gibosa minguante", emoji: "🌖" },
  { max: 0.77, name: "Quarto minguante", emoji: "🌗" },
  { max: 0.98, name: "Lua minguante", emoji: "🌘" },
  { max: 1.01, name: "Lua nova", emoji: "🌑" },
];

export function moonPhase(date: Date | string): MoonPhase {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = d.getTime() / 86400000;
  let fraction = ((days - REF_NEW_MOON) % SYNODIC) / SYNODIC;
  if (fraction < 0) fraction += 1;

  const p = PHASES.find((x) => fraction < x.max) ?? PHASES[PHASES.length - 1];
  // Iluminação aproximada: 0 na lua nova, 1 na cheia.
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  return { fraction, name: p.name, emoji: p.emoji, illumination };
}

export type Season = { name: string; emoji: string; hint: string };

/** Estação do ano no hemisfério sul (o público do app é brasileiro). */
export function seasonOf(date: Date | string): Season {
  const d = typeof date === "string" ? new Date(date) : date;
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 1221 || md < 320) return { name: "Verão", emoji: "🌞", hint: "calor, dias longos" };
  if (md < 621) return { name: "Outono", emoji: "🍂", hint: "folhas caindo, tarde dourada" };
  if (md < 923) return { name: "Inverno", emoji: "❄️", hint: "cobertor e café" };
  return { name: "Primavera", emoji: "🌸", hint: "tudo florescendo" };
}

export type Constellation = {
  name: string;
  sign: string;
  /** Estrelas em coordenadas 0-100 para desenhar o mapa estelar. */
  stars: { x: number; y: number; r: number }[];
  /** Pares de índices de `stars` que se ligam por uma linha. */
  lines: [number, number][];
  poem: string;
};

/**
 * Constelação do zodíaco correspondente à data. É o mesmo critério dos signos
 * — o que a pessoa espera ver quando o app fala "o céu no dia em que…".
 */
export function constellationOf(date: Date | string): Constellation {
  const d = typeof date === "string" ? new Date(date) : date;
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const key =
    md >= 321 && md <= 419 ? "aries" :
    md >= 420 && md <= 520 ? "touro" :
    md >= 521 && md <= 620 ? "gemeos" :
    md >= 621 && md <= 722 ? "cancer" :
    md >= 723 && md <= 822 ? "leao" :
    md >= 823 && md <= 922 ? "virgem" :
    md >= 923 && md <= 1022 ? "libra" :
    md >= 1023 && md <= 1121 ? "escorpiao" :
    md >= 1122 && md <= 1221 ? "sagitario" :
    md >= 1222 || md <= 119 ? "capricornio" :
    md >= 120 && md <= 218 ? "aquario" : "peixes";
  return CONSTELLATIONS[key];
}

const CONSTELLATIONS: Record<string, Constellation> = {
  aries: {
    name: "Áries", sign: "♈", poem: "O céu começava algo naquele dia.",
    stars: [{ x: 20, y: 62, r: 2.4 }, { x: 42, y: 44, r: 3.2 }, { x: 62, y: 38, r: 2.2 }, { x: 80, y: 48, r: 2.8 }],
    lines: [[0, 1], [1, 2], [2, 3]],
  },
  touro: {
    name: "Touro", sign: "♉", poem: "Um céu teimoso, do jeito bom.",
    stars: [{ x: 18, y: 34, r: 2.2 }, { x: 34, y: 52, r: 3.4 }, { x: 54, y: 58, r: 2.6 }, { x: 74, y: 44, r: 2.4 }, { x: 86, y: 28, r: 2 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  gemeos: {
    name: "Gêmeos", sign: "♊", poem: "Duas estrelas lado a lado. Coincidência?",
    stars: [{ x: 32, y: 24, r: 3.2 }, { x: 30, y: 52, r: 2.4 }, { x: 34, y: 78, r: 2.2 }, { x: 68, y: 26, r: 3.2 }, { x: 70, y: 54, r: 2.4 }, { x: 66, y: 80, r: 2.2 }],
    lines: [[0, 1], [1, 2], [3, 4], [4, 5], [1, 4]],
  },
  cancer: {
    name: "Câncer", sign: "♋", poem: "Um céu que abraça.",
    stars: [{ x: 24, y: 40, r: 2.4 }, { x: 44, y: 54, r: 2.8 }, { x: 62, y: 46, r: 3 }, { x: 78, y: 62, r: 2.2 }, { x: 50, y: 74, r: 2 }],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4]],
  },
  leao: {
    name: "Leão", sign: "♌", poem: "O céu estava se exibindo.",
    stars: [{ x: 18, y: 58, r: 3.6 }, { x: 36, y: 44, r: 2.4 }, { x: 54, y: 34, r: 2.8 }, { x: 72, y: 42, r: 2.2 }, { x: 84, y: 60, r: 2.6 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
  virgem: {
    name: "Virgem", sign: "♍", poem: "Cada estrela no lugar exato.",
    stars: [{ x: 22, y: 30, r: 2.2 }, { x: 40, y: 46, r: 2.6 }, { x: 56, y: 58, r: 3.4 }, { x: 74, y: 44, r: 2.4 }, { x: 60, y: 78, r: 2 }],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4]],
  },
  libra: {
    name: "Libra", sign: "♎", poem: "O céu em equilíbrio perfeito.",
    stars: [{ x: 28, y: 62, r: 2.6 }, { x: 50, y: 38, r: 3.2 }, { x: 72, y: 62, r: 2.6 }, { x: 50, y: 76, r: 2.2 }],
    lines: [[0, 1], [1, 2], [1, 3]],
  },
  escorpiao: {
    name: "Escorpião", sign: "♏", poem: "Um céu intenso. Como vocês.",
    stars: [{ x: 16, y: 34, r: 2.4 }, { x: 32, y: 46, r: 3.4 }, { x: 48, y: 56, r: 2.4 }, { x: 66, y: 62, r: 2.6 }, { x: 80, y: 52, r: 2.2 }, { x: 86, y: 34, r: 2.8 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  sagitario: {
    name: "Sagitário", sign: "♐", poem: "O céu apontava para longe.",
    stars: [{ x: 20, y: 68, r: 2.4 }, { x: 38, y: 54, r: 2.8 }, { x: 56, y: 44, r: 3.2 }, { x: 74, y: 30, r: 2.4 }, { x: 52, y: 66, r: 2 }],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4]],
  },
  capricornio: {
    name: "Capricórnio", sign: "♑", poem: "Um céu que sabia onde ia chegar.",
    stars: [{ x: 22, y: 44, r: 2.6 }, { x: 40, y: 60, r: 2.4 }, { x: 60, y: 66, r: 3 }, { x: 78, y: 48, r: 2.4 }, { x: 84, y: 30, r: 2 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  aquario: {
    name: "Aquário", sign: "♒", poem: "O céu derramava algo novo.",
    stars: [{ x: 18, y: 46, r: 2.4 }, { x: 36, y: 38, r: 2.8 }, { x: 54, y: 50, r: 2.4 }, { x: 72, y: 40, r: 3 }, { x: 86, y: 54, r: 2.2 }],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  peixes: {
    name: "Peixes", sign: "♓", poem: "Dois que nadam para o mesmo lado.",
    stars: [{ x: 20, y: 36, r: 2.6 }, { x: 40, y: 48, r: 2.2 }, { x: 60, y: 56, r: 2.4 }, { x: 80, y: 44, r: 3 }, { x: 50, y: 74, r: 2.2 }],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4]],
  },
};

/**
 * Campo de estrelas de fundo, estável para uma mesma semente.
 * Sem `Math.random` para que servidor e cliente desenhem o mesmo céu.
 */
export function starField(count: number, seed = 7): { x: number; y: number; r: number; o: number }[] {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let s = seed || 1;
  const next = () => {
    // gerador congruencial linear simples — só precisa parecer aleatório
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    out.push({ x: next() * 100, y: next() * 100, r: 0.6 + next() * 1.5, o: 0.25 + next() * 0.6 });
  }
  return out;
}
