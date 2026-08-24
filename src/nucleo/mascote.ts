// O bichinho do casal.
//
// Um gatinho siamês que evolui com o uso do app.

import { moodOf } from "./humores";

export type MascotStage = 0 | 1 | 2 | 3 | 4;
export type MascotMood = "radiante" | "feliz" | "animado" | "sonolento" | "saudade";
export type MascotFeature =
  | "estrelas"
  | "coroa"
  | "aureola"
  | "asas"
  | "flor"
  | "oculos"
  | "cachecol"
  | "lacinho";

/**
 * "Espécie" do bichinho — o segundo eixo de evolução, além da fase.
 * Deriva do comportamento dominante do casal (o que eles mais fazem no app),
 * não de uma escolha manual. `equilibrado` é o padrão quando nada se destaca.
 */
export type MascotSpecies = "escritor" | "fotografo" | "viajante" | "coracao" | "guardiao" | "equilibrado";

export type MascotInput = {
  level: number;
  /** Chave do humor mais frequente do casal (ex.: "feliz"). */
  topMoodKey: string | null;
  streak: number;
  bestStreak: number;
  /** Dias desde o último registro de qualquer um dos dois. */
  daysSinceActive: number;
  total: number;
  words: number;
  photos: number;
  places: number;
  capsules: number;
  likes: number;
  comments: number;
  daysTogether: number | null;
};

export type MascotState = {
  stage: MascotStage;
  stageName: string;
  mood: MascotMood;
  moodLabel: string;
  bodyColor: string;
  bellyColor: string;
  cheekColor: string;
  features: MascotFeature[];
  /** Progresso (0-1) até a próxima fase. */
  progress: number;
  toNext: { current: number; goal: number; label: string } | null;
  /** Energia/ânimo (0-1) pela atividade recente — vira "carência". */
  energy: number;
  daysSinceActive: number;
  /** Espécie (eixo de evolução por comportamento) + explicação de por quê. */
  species: MascotSpecies;
  speciesLabel: string;
  /** Frase pt-BR explicando, com números reais do casal, por que essa espécie. */
  speciesWhy: string;
};

/**
 * As cinco fases do gatinho. Exportadas daqui (e não copiadas nas telas) para
 * nome, nível e descrição nunca saírem de sincronia entre a página e o estado.
 */
export const STAGE_NAMES = ["Novelo", "Filhote", "Jovem", "Adulto", "Lendário"];

/** Fase pela evolução: usa o nível de conexão do casal. */
export const STAGE_LEVELS = [0, 2, 5, 10, 20]; // nível mínimo de cada fase

/** Como cada fase é apresentada na página do bichinho. */
export const STAGE_INFO: { emoji: string; desc: string; unlocks: string[] }[] = [
  {
    emoji: "🧶",
    desc: "Um novelinho enrolado na cestinha, dormindo o dia inteiro.",
    unlocks: ["O gatinho abre os olhos", "Primeira forma: Filhote"],
  },
  {
    emoji: "🐾",
    desc: "Acabou de acordar para o mundo: pequeno, cabeçudo e curioso.",
    unlocks: ["Corpo maior", "Coleira do casal", "Acessórios liberados"],
  },
  {
    emoji: "🐈",
    desc: "Já anda pela casa com confiança e ronrona quando vocês aparecem.",
    unlocks: ["Tamanho quase adulto", "Pelagem mais marcada"],
  },
  {
    emoji: "🐈‍⬛",
    desc: "Siamês adulto, elegante e cheio de personalidade.",
    unlocks: ["Aura dourada permanente", "Brilhos na cauda", "Forma Lendária"],
  },
  {
    emoji: "✨",
    desc: "O auge: um siamês lendário, com aura e brilho próprios.",
    unlocks: [],
  },
];

function stageFromLevel(level: number): MascotStage {
  let s: MascotStage = 0;
  for (let i = 0; i < STAGE_LEVELS.length; i++) if (level >= STAGE_LEVELS[i]) s = i as MascotStage;
  return s;
}

/**
 * A pelagem é sempre siamesa (creme com pontas escuras) — quem muda é a cor de
 * destaque: coleira, aura e brilhos saem do humor dominante do casal, para o
 * gatinho ser reconhecidamente deles sem deixar de ser um siamês.
 */
function accentFromMood(topMoodKey: string | null): { body: string; belly: string; cheek: string } {
  const base = moodOf(topMoodKey)?.color ?? "#9575E8"; // roxo do app como neutro
  return { body: base, belly: "#FFF7EC", cheek: "#EFA3A8" };
}

/** Expressão pela atividade recente e sequência. */
function moodFromActivity(daysSinceActive: number, streak: number): { mood: MascotMood; label: string } {
  if (daysSinceActive >= 7) return { mood: "saudade", label: "com saudade" };
  if (daysSinceActive >= 3) return { mood: "sonolento", label: "sonolento" };
  if (streak >= 7) return { mood: "radiante", label: "radiante" };
  if (daysSinceActive === 0) return { mood: "animado", label: "animado" };
  return { mood: "feliz", label: "feliz" };
}

/** Acessórios desbloqueados por marcos. */
function featuresFrom(i: MascotInput): MascotFeature[] {
  const f: MascotFeature[] = [];
  if (i.bestStreak >= 7) f.push("estrelas");
  if (i.places >= 5) f.push("flor");
  if (i.words >= 5000) f.push("oculos");
  if (i.capsules >= 1) f.push("lacinho");
  if (i.photos >= 50) f.push("asas");
  if ((i.daysTogether ?? 0) >= 365) f.push("cachecol");
  if (i.level >= 10) f.push("coroa");
  if (i.level >= 20) f.push("aureola");
  return f;
}

/**
 * Espécie pelo comportamento dominante do casal.
 *
 * Cada eixo tem um "limiar" (o valor que consideramos notável para aquele
 * comportamento). Normalizamos cada estatística pelo seu limiar para poder
 * comparar coisas bem diferentes (palavras x fotos x dias de sequência) na
 * mesma escala. A espécie vencedora precisa (a) ter batido o próprio limiar
 * e (b) estar nitidamente à frente da segunda colocada — senão o casal é
 * "equilibrado", porque nenhum comportamento realmente se destacou.
 */
const SPECIES_THRESHOLDS = {
  escritor: 3000, // palavras escritas juntos
  fotografo: 40, // fotos guardadas
  viajante: 6, // lugares distintos registrados
  coracao: 60, // reações + comentários trocados
  guardiao: 14, // maior sequência de dias
} as const;

/** Margem mínima (15%) que o líder precisa ter sobre o 2º lugar para "vencer". */
const SPECIES_MARGIN = 1.15;

function speciesFrom(i: MascotInput): { species: MascotSpecies; label: string; why: string } {
  const hearts = i.likes + i.comments;
  const scores: Record<Exclude<MascotSpecies, "equilibrado">, number> = {
    escritor: i.words / SPECIES_THRESHOLDS.escritor,
    fotografo: i.photos / SPECIES_THRESHOLDS.fotografo,
    viajante: i.places / SPECIES_THRESHOLDS.viajante,
    coracao: hearts / SPECIES_THRESHOLDS.coracao,
    guardiao: i.bestStreak / SPECIES_THRESHOLDS.guardiao,
  };

  const ranked = (Object.entries(scores) as [Exclude<MascotSpecies, "equilibrado">, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const [topKey, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;

  const wins = topScore >= 1 && topScore >= secondScore * SPECIES_MARGIN;
  const species: MascotSpecies = wins ? topKey : "equilibrado";

  const why: Record<MascotSpecies, string> = {
    escritor: `Vocês já escreveram ${i.words.toLocaleString("pt-BR")} palavras juntos — poucos casais têm tanto o que contar.`,
    fotografo: `${i.photos.toLocaleString("pt-BR")} fotos guardadas — um olhar apaixonado por cada instante.`,
    viajante: `${i.places.toLocaleString("pt-BR")} lugares diferentes registrados — vocês não ficam parados!`,
    coracao: `${hearts.toLocaleString("pt-BR")} reações e comentários trocados — muito carinho por aqui.`,
    guardiao: `Uma sequência de ${i.bestStreak} dias seguidos — constância de impressionar.`,
    equilibrado: `Vocês equilibram tudo — palavras, fotos, lugares e carinho, sem exagerar de um só lado.`,
  };

  const labels: Record<MascotSpecies, string> = {
    escritor: "Escritor",
    fotografo: "Fotógrafo",
    viajante: "Viajante",
    coracao: "Coração",
    guardiao: "Guardião",
    equilibrado: "Equilibrado",
  };

  return { species, label: labels[species], why: why[species] };
}

/** Progresso de nível para a próxima fase. */
function progressToNext(level: number): MascotState["toNext"] & { progress: number } {
  const stage = stageFromLevel(level);
  if (stage >= 4) return { current: level, goal: level, label: "Fase máxima", progress: 1 } as any;
  const from = STAGE_LEVELS[stage];
  const to = STAGE_LEVELS[stage + 1];
  const progress = Math.min(1, Math.max(0, (level - from) / (to - from)));
  return { current: level, goal: to, label: `Nível ${level} de ${to}`, progress };
}

export function mascotState(i: MascotInput): MascotState {
  const stage = stageFromLevel(i.level);
  const colors = accentFromMood(i.topMoodKey);
  const { mood, label } = moodFromActivity(i.daysSinceActive, i.streak);
  const next = progressToNext(i.level);
  const species = speciesFrom(i);

  return {
    stage,
    stageName: STAGE_NAMES[stage],
    mood,
    moodLabel: label,
    bodyColor: colors.body,
    bellyColor: colors.belly,
    cheekColor: colors.cheek,
    features: featuresFrom(i),
    progress: next.progress,
    toNext: stage >= 4 ? null : { current: next.current, goal: next.goal, label: next.label },
    energy: 1 - Math.min(1, i.daysSinceActive / 7),
    daysSinceActive: i.daysSinceActive,
    species: species.species,
    speciesLabel: species.label,
    speciesWhy: species.why,
  };
}

/**
 * O que o gatinho diz.
 *
 * Ele fala em primeira pessoa, com os números reais do casal, porque um bichinho
 * de estimação não anuncia o próprio "status" — ele reclama, pede colo e conta
 * o que andou vendo. É o mesmo dado que ficava nos crachás (fase, espécie,
 * humor), só que dito por ele.
 *
 * Devolve uma lista para a tela poder ir alternando as falas.
 */
export function mascotFalas(state: MascotState, nome?: string | null): string[] {
  const eu = nome?.trim() || "eu";
  const falas: string[] = [];
  const dias = state.daysSinceActive;

  // O humor manda: é o que a pessoa precisa ouvir primeiro.
  if (state.mood === "saudade") {
    falas.push(
      `Faz ${dias} dias que ninguém escreve nada… vocês esqueceram de mim?`,
      "Tô aqui na janela esperando alguém aparecer.",
      "Miau. É sério, tô com saudade."
    );
  } else if (state.mood === "sonolento") {
    falas.push(
      `${dias} dias sem novidade por aqui. Vou tirar mais um cochilo.`,
      "Se vocês escreverem alguma coisa eu acordo, prometo.",
      "Bocejo… tá quieto demais nessa casa."
    );
  } else if (state.mood === "radiante") {
    falas.push(
      "Vocês não falham um dia! Tô ronronando sem parar.",
      "Essa sequência de vocês tá me deixando enorme.",
      "Hoje eu corri atrás do próprio rabo de tanta alegria."
    );
  } else if (state.mood === "animado") {
    falas.push(
      "Vocês escreveram hoje! Já tô melhor.",
      "Adoro quando vocês aparecem juntos.",
      "Miau feliz. Pode fazer carinho."
    );
  } else {
    falas.push("Tô de boa por aqui, esperando a próxima memória de vocês.", "Que tal me contar como foi o dia?");
  }

  // Uma fala sobre a fase, para a evolução aparecer na conversa.
  if (state.stage === 0) {
    falas.push("Ainda tô enroladinho na cestinha. Me deixa dormir mais um pouco.");
  } else if (state.stage === 4) {
    falas.push("Cheguei no meu auge, e foi tudo culpa de vocês dois.");
  } else if (state.toNext) {
    const faltam = state.toNext.goal - state.toNext.current;
    falas.push(
      faltam <= 1
        ? "Tô quase mudando de fase! Falta pouquinho."
        : `Faltam ${faltam} níveis pra eu crescer de novo.`
    );
  }

  // E uma sobre a espécie, dita como gosto pessoal e não como rótulo.
  const porEspecie: Record<MascotSpecies, string> = {
    escritor: "Gosto de dormir em cima das palavras que vocês escrevem.",
    fotografo: "Já perdi a conta das fotos que vocês guardaram aqui.",
    viajante: "Vocês vivem me trazendo cheiro de lugar novo.",
    coracao: "Essa casa vive cheia de coraçãozinho, e eu aprovo.",
    guardiao: "Eu tomo conta da sequência de vocês. Não falha, hein.",
    equilibrado: "Vocês fazem um pouco de tudo. Eu gosto assim.",
  };
  falas.push(porEspecie[state.species]);

  return falas;
}

/** Catálogo de espécies: para mostrar os "outros caminhos" possíveis na página. */
export const SPECIES_INFO: Record<MascotSpecies, { emoji: string; name: string; how: string }> = {
  escritor: { emoji: "🖋️", name: "Escritor", how: "3 mil palavras escritas" },
  fotografo: { emoji: "📷", name: "Fotógrafo", how: "40 fotos guardadas" },
  viajante: { emoji: "🧭", name: "Viajante", how: "6 lugares diferentes" },
  coracao: { emoji: "💗", name: "Coração", how: "60 reações e comentários" },
  guardiao: { emoji: "🛡️", name: "Guardião", how: "Sequência de 14 dias" },
  equilibrado: { emoji: "⚖️", name: "Equilibrado", how: "Um pouco de tudo" },
};

/** Catálogo de acessórios: o que cada um representa e como desbloquear. */
export const FEATURE_INFO: Record<MascotFeature, { emoji: string; name: string; how: string }> = {
  estrelas: { emoji: "✨", name: "Estrelas", how: "Sequência de 7 dias" },
  flor: { emoji: "🌸", name: "Florzinha", how: "5 lugares registrados" },
  oculos: { emoji: "🤓", name: "Óculos", how: "5 mil palavras escritas" },
  lacinho: { emoji: "🎀", name: "Laço", how: "Lacrar 1 cápsula do tempo" },
  asas: { emoji: "🪽", name: "Asas", how: "50 fotos guardadas" },
  cachecol: { emoji: "🧣", name: "Cachecol", how: "1 ano juntos" },
  coroa: { emoji: "👑", name: "Coroa", how: "Nível 10" },
  aureola: { emoji: "😇", name: "Auréola", how: "Nível 20" },
};

/* ── utilitário de cor ── */
function lighten(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
