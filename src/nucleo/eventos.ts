// Eventos surpresa do dia.
//
// Uma vez por dia o casal recebe um "evento": um pequeno desafio de gesto que,
// ao ser cumprido, vira um SEGREDO entregue ao parceiro num modal animado.
// A graça está na surpresa — por isso o conteúdo chega lacrado.

export type EventKind = "text" | "photo" | "mixed";

export type SurpriseEvent = {
  id: string;
  emoji: string;
  /** O desafio mostrado para quem vai enviar. */
  prompt: string;
  /** Como o segredo é anunciado ao parceiro, sem revelar o conteúdo. */
  teaser: string;
  kind: EventKind;
  /** Texto de exemplo/placeholder no campo de envio. */
  placeholder?: string;
};

export const EVENTS: SurpriseEvent[] = [
  {
    id: "foto-sem-dizer",
    emoji: "📸",
    prompt: "Envie uma foto pra ele sem dizer nada.",
    teaser: "mandou uma foto sem dizer nada",
    kind: "photo",
    placeholder: "Sem legenda… é surpresa 😉",
  },
  {
    id: "elogio-secreto",
    emoji: "💗",
    prompt: "Escreva um elogio que você nunca disse em voz alta.",
    teaser: "guardou um elogio pra você",
    kind: "text",
    placeholder: "Aquilo que você admira e nunca falou…",
  },
  {
    id: "memoria-favorita",
    emoji: "✨",
    prompt: "Conte qual é a sua memória favorita de vocês dois.",
    teaser: "escolheu uma memória favorita",
    kind: "text",
    placeholder: "O momento que você guardaria pra sempre…",
  },
  {
    id: "vontade-secreta",
    emoji: "🤫",
    prompt: "Revele uma vontade que você ainda não teve coragem de contar.",
    teaser: "revelou uma vontade secreta",
    kind: "text",
    placeholder: "Aquilo que passa pela sua cabeça…",
  },
  {
    id: "selfie-agora",
    emoji: "🤳",
    prompt: "Tire uma selfie agora, do jeito que você está, e mande.",
    teaser: "mandou uma selfie de agora",
    kind: "photo",
    placeholder: "Sem pose, sem filtro — é você agora.",
  },
  {
    id: "musica-que-lembra",
    emoji: "🎧",
    prompt: "Mande o nome de uma música que te lembra dele ou dela.",
    teaser: "escolheu uma música que lembra você",
    kind: "text",
    placeholder: "A música e por que ela lembra vocês…",
  },
  {
    id: "gratidao-do-dia",
    emoji: "🙏",
    prompt: "Diga uma coisa pela qual você é grato hoje por ter essa pessoa.",
    teaser: "deixou uma gratidão pra você",
    kind: "text",
    placeholder: "Hoje eu sou grato por…",
  },
  {
    id: "promessa-pequena",
    emoji: "🤞",
    prompt: "Faça uma promessa pequena, dessas que dá pra cumprir esta semana.",
    teaser: "fez uma promessa pra você",
    kind: "text",
    placeholder: "Esta semana eu prometo…",
  },
  {
    id: "foto-do-que-ve",
    emoji: "🌇",
    prompt: "Fotografe o que você está vendo agora e mande sem contexto.",
    teaser: "mandou o que está vendo agora",
    kind: "photo",
    placeholder: "O que estiver na sua frente.",
  },
  {
    id: "saudade-secreta",
    emoji: "🫶",
    prompt: "Escreva do que você está com saudade quando ele ou ela não está.",
    teaser: "confessou uma saudade",
    kind: "text",
    placeholder: "Quando você não está, eu sinto falta de…",
  },
  {
    id: "plano-surpresa",
    emoji: "🗺️",
    prompt: "Conte um plano que você quer fazer com ele ou ela e ainda não falou.",
    teaser: "guardou um plano pra vocês",
    kind: "text",
    placeholder: "Um dia eu quero que a gente…",
  },
  {
    id: "primeira-impressao",
    emoji: "💘",
    prompt: "Revele o que você pensou de verdade quando viu essa pessoa pela primeira vez.",
    teaser: "revelou a primeira impressão sobre você",
    kind: "text",
    placeholder: "Quando eu te vi pela primeira vez, eu pensei…",
  },
];

export const eventMap = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

/**
 * Evento do dia para um casal.
 *
 * Determinístico por (dia + casal): os dois veem o mesmo evento no mesmo dia,
 * e recarregar a página não troca. O casal entra na conta para a rotação não
 * ser igual para todo mundo no mesmo dia.
 */
export function eventOfTheDay(coupleId: string, d = new Date()): SurpriseEvent {
  const dayNum = Number(
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  );
  let h = dayNum >>> 0;
  for (let i = 0; i < coupleId.length; i++) h = (h * 31 + coupleId.charCodeAt(i)) >>> 0;
  return EVENTS[h % EVENTS.length];
}

/** Chave "YYYY-MM-DD" do dia, para saber se o evento de hoje já foi cumprido. */
export function eventDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
