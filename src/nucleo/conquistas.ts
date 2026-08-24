// Conquistas do casal — o "conquista desbloqueada" da retrospectiva e o
// Hall de Troféus.
//
// O catálogo é declarativo: cada troféu diz qual é a meta e como ler o valor
// atual. Assim o mesmo dado serve para (a) listar o que já foi desbloqueado e
// (b) mostrar o quanto falta para o que ainda não foi — sem duplicar regra.

export type Tier = "bronze" | "prata" | "ouro" | "lenda";

export type Achievement = {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  tier: Tier;
};

export type AchievementInput = {
  total: number;
  words: number;
  photos: number;
  likes: number;
  comments: number;
  places: number;
  capsules: number;
  daysTogether: number | null;
  level: number;
  /** Maior sequência de dias com registro. */
  bestStreak: number;
  /** Quantas memórias cada pessoa escreveu, do maior para o menor. */
  authorCounts: number[];
  /** Quantos meses distintos tiveram registro. */
  activeMonths: number;
  /** Registros feitos entre 0h e 5h. */
  lateNights: number;
};

const TIER_ORDER: Record<Tier, number> = { lenda: 0, ouro: 1, prata: 2, bronze: 3 };

export const TIER_COLOR: Record<Tier, string> = {
  bronze: "#C08A5E",
  prata: "#C9D1DA",
  ouro: "#E0A84A",
  lenda: "#B388FF",
};

export const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  lenda: "Lenda",
};

export type TrophyDef = {
  key: string;
  emoji: string;
  title: string;
  tier: Tier;
  /** Categoria, para agrupar no hall. */
  group: "memórias" | "escrita" | "fotos" | "carinho" | "constância" | "dupla" | "tempo" | "extras";
  /** Meta a alcançar. */
  goal: (i: AchievementInput) => number;
  /** Valor atual. */
  current: (i: AchievementInput) => number;
  /** Descrição, podendo usar os números do casal. */
  desc: (i: AchievementInput) => string;
  /** Troféu só faz sentido em alguns casos (ex.: precisa ter aniversário). */
  available?: (i: AchievementInput) => boolean;
};

const n = (v: number) => v.toLocaleString("pt-BR");

export const TROPHIES: TrophyDef[] = [
  // ── Memórias ──
  { key: "primeira", emoji: "🌱", title: "A primeira página", tier: "bronze", group: "memórias",
    goal: () => 1, current: (i) => i.total, desc: () => "Guardem a primeira memória." },
  { key: "dez", emoji: "📚", title: "Dez capítulos", tier: "bronze", group: "memórias",
    goal: () => 10, current: (i) => i.total, desc: () => "Cheguem a 10 memórias." },
  { key: "cinquenta", emoji: "🏛️", title: "Acervo do amor", tier: "prata", group: "memórias",
    goal: () => 50, current: (i) => i.total, desc: () => "50 memórias — já é biblioteca." },
  { key: "cem", emoji: "💯", title: "Cem vezes vocês", tier: "ouro", group: "memórias",
    goal: () => 100, current: (i) => i.total, desc: () => "Cheguem a 100 memórias." },
  { key: "ano", emoji: "🗓️", title: "Um ano de registros", tier: "lenda", group: "memórias",
    goal: () => 365, current: (i) => i.total, desc: () => "365 memórias. Isso é devoção." },

  // ── Escrita ──
  { key: "mil-palavras", emoji: "✍️", title: "Mil palavras", tier: "bronze", group: "escrita",
    goal: () => 1000, current: (i) => i.words, desc: () => "Escrevam 1.000 palavras. Já daria um conto." },
  { key: "novela", emoji: "📖", title: "Autores de vocês", tier: "ouro", group: "escrita",
    goal: () => 10000, current: (i) => i.words, desc: () => "10 mil palavras — uma novela curta." },
  { key: "romance", emoji: "🏆", title: "Um romance inteiro", tier: "lenda", group: "escrita",
    goal: () => 50000, current: (i) => i.words, desc: () => "50 mil palavras. Sério." },

  // ── Fotos e lugares ──
  { key: "album", emoji: "📸", title: "Álbum aberto", tier: "bronze", group: "fotos",
    goal: () => 10, current: (i) => i.photos, desc: (i) => `${n(i.photos)} de 10 fotos guardadas.` },
  { key: "fotografos", emoji: "🎞️", title: "Fotógrafos oficiais", tier: "ouro", group: "fotos",
    goal: () => 100, current: (i) => i.photos, desc: () => "Cheguem a 100 fotos no diário." },
  { key: "viajantes", emoji: "📍", title: "Mapa marcado", tier: "bronze", group: "fotos",
    goal: () => 3, current: (i) => i.places, desc: () => "Registrem 3 lugares diferentes." },
  { key: "exploradores", emoji: "🌍", title: "Exploradores", tier: "prata", group: "fotos",
    goal: () => 10, current: (i) => i.places, desc: () => "Registrem 10 lugares diferentes." },

  // ── Carinho ──
  { key: "carinho", emoji: "💌", title: "Carinho trocado", tier: "bronze", group: "carinho",
    goal: () => 20, current: (i) => i.likes + i.comments, desc: () => "20 curtidas e comentários." },
  { key: "muito-carinho", emoji: "💞", title: "Nunca deixam sem resposta", tier: "ouro", group: "carinho",
    goal: () => 200, current: (i) => i.likes + i.comments, desc: () => "200 gestos de carinho." },

  // ── Constância ──
  { key: "semana", emoji: "🔥", title: "Uma semana seguida", tier: "prata", group: "constância",
    goal: () => 7, current: (i) => i.bestStreak, desc: (i) => `Melhor sequência: ${i.bestStreak} de 7 dias.` },
  { key: "mes-seguido", emoji: "⚡", title: "Um mês inteiro", tier: "lenda", group: "constância",
    goal: () => 30, current: (i) => i.bestStreak, desc: () => "30 dias de sequência sem falhar." },
  { key: "meio-ano", emoji: "🌗", title: "Meio ano de história", tier: "prata", group: "constância",
    goal: () => 6, current: (i) => i.activeMonths, desc: (i) => `${i.activeMonths} de 6 meses com registros.` },
  { key: "doze-meses", emoji: "🌕", title: "O ano todo", tier: "ouro", group: "constância",
    goal: () => 12, current: (i) => i.activeMonths, desc: () => "12 meses com registros." },

  // ── Dupla ──
  { key: "dupla", emoji: "👥", title: "Diário a dois", tier: "bronze", group: "dupla",
    goal: () => 2, current: (i) => i.authorCounts.filter((c) => c > 0).length,
    desc: () => "Os dois registrarem por aqui." },
  { key: "equilibrio", emoji: "⚖️", title: "Dois lados da história", tier: "ouro", group: "dupla",
    available: (i) => i.authorCounts.length >= 2 && i.authorCounts[1] > 0,
    goal: () => 1,
    current: (i) => {
      const [a, b] = i.authorCounts;
      return b > 0 && Math.abs(a - b) <= Math.max(2, a * 0.1) ? 1 : 0;
    },
    desc: () => "Os dois escrevendo quase igual." },

  // ── Tempo juntos ──
  { key: "um-ano", emoji: "🎂", title: "Mais de um ano", tier: "prata", group: "tempo",
    available: (i) => i.daysTogether != null,
    goal: () => 365, current: (i) => i.daysTogether ?? 0,
    desc: (i) => `${n(i.daysTogether ?? 0)} de 365 dias juntos.` },
  { key: "mil-dias", emoji: "✨", title: "Mil dias", tier: "ouro", group: "tempo",
    available: (i) => i.daysTogether != null,
    goal: () => 1000, current: (i) => i.daysTogether ?? 0,
    desc: (i) => `${n(i.daysTogether ?? 0)} de 1.000 dias.` },
  { key: "decada", emoji: "👑", title: "Uma década", tier: "lenda", group: "tempo",
    available: (i) => i.daysTogether != null,
    goal: () => 3650, current: (i) => i.daysTogether ?? 0,
    desc: () => "10 anos. Isso é história." },

  // ── Extras ──
  { key: "capsula", emoji: "⏳", title: "Mensagem pro futuro", tier: "prata", group: "extras",
    goal: () => 1, current: (i) => i.capsules, desc: () => "Lacrem uma cápsula do tempo." },
  { key: "capsulas", emoji: "🗝️", title: "Guardiões do tempo", tier: "ouro", group: "extras",
    goal: () => 5, current: (i) => i.capsules, desc: (i) => `${i.capsules} de 5 cápsulas lacradas.` },
  { key: "madrugada", emoji: "🌙", title: "Poetas da madrugada", tier: "prata", group: "extras",
    goal: () => 5, current: (i) => i.lateNights,
    desc: (i) => `${i.lateNights} de 5 registros depois da meia-noite.` },
  { key: "nivel", emoji: "🏅", title: "Nível 10", tier: "ouro", group: "extras",
    goal: () => 10, current: (i) => i.level, desc: (i) => `Nível ${i.level} de 10.` },
];

export type TrophyState = {
  def: TrophyDef;
  achievement: Achievement;
  current: number;
  goal: number;
  unlocked: boolean;
  /** Progresso de 0 a 1. */
  pct: number;
};

/** Estado de todos os troféus aplicáveis ao casal, do mais raro ao mais comum. */
export function allTrophies(i: AchievementInput): TrophyState[] {
  return TROPHIES.filter((d) => (d.available ? d.available(i) : true))
    .map((def) => {
      const goal = def.goal(i);
      const current = Math.max(0, def.current(i));
      const unlocked = current >= goal;
      return {
        def,
        achievement: { key: def.key, emoji: def.emoji, title: def.title, desc: def.desc(i), tier: def.tier },
        current,
        goal,
        unlocked,
        pct: goal > 0 ? Math.min(1, current / goal) : 0,
      };
    })
    .sort((a, b) => {
      // desbloqueados primeiro, depois por raridade, depois por progresso
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      const t = TIER_ORDER[a.def.tier] - TIER_ORDER[b.def.tier];
      if (t !== 0) return t;
      return b.pct - a.pct;
    });
}

/**
 * Só as conquistas desbloqueadas, das mais raras para as mais comuns.
 * É o que a retrospectiva usa.
 */
export function unlockedAchievements(i: AchievementInput): Achievement[] {
  return allTrophies(i)
    .filter((t) => t.unlocked)
    .sort((a, b) => TIER_ORDER[a.def.tier] - TIER_ORDER[b.def.tier])
    .map((t) => t.achievement);
}

/**
 * Versão plana de um troféu, sem funções.
 *
 * `TrophyState` guarda o `def` inteiro (com `goal`, `current`, `desc`), e
 * funções não podem ser passadas de Server para Client Component. O hall
 * consome este DTO.
 */
export type TrophyDTO = {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  tier: Tier;
  group: TrophyDef["group"];
  current: number;
  goal: number;
  unlocked: boolean;
  pct: number;
};

export function serializeTrophy(t: TrophyState): TrophyDTO {
  return {
    key: t.def.key,
    emoji: t.def.emoji,
    title: t.def.title,
    desc: t.achievement.desc,
    tier: t.def.tier,
    group: t.def.group,
    current: t.current,
    goal: t.goal,
    unlocked: t.unlocked,
    pct: t.pct,
  };
}

/** Resumo para cabeçalho: quantos de quantos, e pontos de raridade. */
export function trophySummary(list: TrophyState[]) {
  const unlocked = list.filter((t) => t.unlocked);
  const byTier = { bronze: 0, prata: 0, ouro: 0, lenda: 0 } as Record<Tier, number>;
  for (const t of unlocked) byTier[t.def.tier]++;
  return { unlocked: unlocked.length, total: list.length, byTier };
}
