// Complete a Frase em dupla remota — os dois recebem a mesma frase inacabada,
// escrevem em paralelo sem ver a resposta do outro, e as respostas se revelam
// juntas quando ambos enviam. Ganha um bônus de "sintonia" quando as respostas
// se parecem.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError, embaralhar, similaridade } from "./utilitarios";

export const FRASES = [
  "Eu gosto de você porque...",
  "Nosso encontro perfeito seria...",
  "O que eu mais admiro em você é...",
  "Meu momento favorito com você foi...",
  "Se eu pudesse te dar um presente seria...",
  "Você me faz sentir...",
  "Quando penso no futuro, vejo...",
  "Nossa música seria...",
  "Meu apelido secreto pra você é...",
  "O que ninguém sabe sobre nós é...",
  "O melhor conselho de amor que recebi foi...",
  "Se eu pudesse voltar no tempo, eu...",
  "A coisa mais engraçada que já fizemos juntos foi...",
  "O que eu nunca te contei, mas quero que saiba é...",
  "Nosso maior desafio como casal foi...",
  "Sempre que olho pra você, penso...",
  "O primeiro pensamento que tive ao te ver foi...",
  "Uma tradição nossa que eu amo é...",
];

export type CompleteState = {
  order: number[];
  round: number;
  answers: Record<string, string | null>;
  revealed: boolean;
  sintonia: boolean;
};

function frase(state: CompleteState): string {
  return FRASES[state.order[state.round % state.order.length]];
}

export const complete: GameModule<CompleteState> = {
  label: "Complete a Frase",
  desc: "A mesma frase, duas respostas — revelam juntos",
  simultaneous: true,

  createInitialState(hostId, guestId) {
    return {
      order: embaralhar(FRASES.map((_, i) => i)),
      round: 0,
      answers: { [hostId]: null, [guestId]: null },
      revealed: false,
      sintonia: false,
    };
  },

  initialTurn() {
    return null;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<CompleteState>): MoveResult<CompleteState> {
    if (move.type === "responder") {
      if (state.revealed) throw new MoveError("Essa rodada já foi revelada.");
      if (state.answers[userId] != null) throw new MoveError("Você já respondeu essa frase.");
      const text = String(move.text ?? "").trim().slice(0, 240);
      if (!text) throw new MoveError("Escreva algo antes de enviar.");
      const answers = { ...state.answers, [userId]: text };
      const both = answers[hostId] != null && answers[guestId] != null;
      if (!both) return { state: { ...state, answers } };

      const sintonia = similaridade(String(answers[hostId]), String(answers[guestId])) >= 0.4;
      const scoreDelta: Record<string, number> = { [hostId]: 10, [guestId]: 10 };
      if (sintonia) {
        scoreDelta[hostId] += 15;
        scoreDelta[guestId] += 15;
      }
      return { state: { ...state, answers, revealed: true, sintonia }, scoreDelta };
    }

    if (move.type === "proxima") {
      if (!state.revealed) throw new MoveError("Esperem os dois responderem antes de avançar.");
      const round = state.round + 1;
      const order = round % state.order.length === 0 ? embaralhar(FRASES.map((_, i) => i)) : state.order;
      return {
        state: { order, round, answers: { [hostId]: null, [guestId]: null }, revealed: false, sintonia: false },
      };
    }

    throw new MoveError("Jogada desconhecida.");
  },

  sanitize(state, viewerId) {
    if (state.revealed) return { ...state, phrase: frase(state) };
    // Antes de revelar, só se vê a própria resposta — a do parceiro vira um booleano.
    const answers: Record<string, string | null | boolean> = {};
    for (const [uid, val] of Object.entries(state.answers)) {
      answers[uid] = uid === viewerId ? val : val != null;
    }
    return { ...state, answers, phrase: frase(state) };
  },
};
