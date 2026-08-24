export type Mood = {
  key: string;
  emoji: string;
  label: string;
  color: string;
};

export const MOODS: Mood[] = [
  { key: "radiante", emoji: "😍", label: "Radiante", color: "#F06595" },
  { key: "feliz", emoji: "😊", label: "Feliz", color: "#FFB84D" },
  { key: "apaixonado", emoji: "🥰", label: "Apaixonado(a)", color: "#E5679B" },
  { key: "grato", emoji: "🥹", label: "Grato(a)", color: "#C48AF0" },
  { key: "calmo", emoji: "😌", label: "Calmo(a)", color: "#4ABEB0" },
  { key: "animado", emoji: "🤩", label: "Animado(a)", color: "#FF922B" },
  { key: "pensativo", emoji: "🤔", label: "Pensativo(a)", color: "#748FFC" },
  { key: "saudade", emoji: "🥺", label: "Saudade", color: "#9575E8" },
  { key: "cansado", emoji: "😴", label: "Cansado(a)", color: "#868E96" },
  { key: "ansioso", emoji: "😥", label: "Ansioso(a)", color: "#5AA0F0" },
  { key: "triste", emoji: "😢", label: "Triste", color: "#5C7CFA" },
  { key: "chateado", emoji: "😤", label: "Chateado(a)", color: "#E96E7A" },
];

export const moodMap = Object.fromEntries(MOODS.map((m) => [m.key, m]));

export function moodOf(key?: string | null): Mood | undefined {
  return key ? moodMap[key] : undefined;
}
