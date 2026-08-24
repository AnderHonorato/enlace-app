// Os temas do Enlace são variações de papel e de tinta, não de cor.
// As chaves aqui precisam existir como [data-theme="…"] em globals.css.
export const LIGHT_PALETTES = [
  { key: "papel", label: "Papel", swatch: ["#F6F1E8", "#C0395C"] },
  { key: "sepia", label: "Sépia", swatch: ["#EDE4D5", "#C0395C"] },
  { key: "alvo", label: "Alvo", swatch: ["#FAF9F6", "#17140F"] },
] as const;

export const DARK_PALETTES = [
  { key: "tinta", label: "Tinta", swatch: ["#191510", "#E0607F"] },
  { key: "nanquim", label: "Nanquim", swatch: ["#0E0C0A", "#E0607F"] },
] as const;

export const ACCENTS = [
  { key: "carmim", label: "Carmim", color: "#C0395C" },
  { key: "rose", label: "Rosa", color: "#E5679B" },
  { key: "coral", label: "Coral", color: "#E0604C" },
  { key: "gold", label: "Ouro", color: "#B8862F" },
  { key: "teal", label: "Verde-água", color: "#2A9286" },
  { key: "sky", label: "Céu", color: "#347AC4" },
  { key: "tinta", label: "Tinta", color: "#17140F" },
] as const;

export const LIGHT_KEYS = LIGHT_PALETTES.map((p) => p.key);
export const DARK_KEYS = DARK_PALETTES.map((p) => p.key);
export const THEME_KEYS = [...LIGHT_KEYS, ...DARK_KEYS];
export const ACCENT_KEYS = ACCENTS.map((a) => a.key);

/** Padrões usados na inicialização e como alternativa para chaves antigas. */
export const DEFAULT_LIGHT = "papel";
export const DEFAULT_DARK = "tinta";
export const DEFAULT_ACCENT = "carmim";

export type LightKey = (typeof LIGHT_PALETTES)[number]["key"];
export type DarkKey = (typeof DARK_PALETTES)[number]["key"];
export type AccentKey = (typeof ACCENTS)[number]["key"];
