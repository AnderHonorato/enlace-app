// Jogo da Verdade em dupla remota — a mesma pergunta/desafio de JogoVerdade.tsx,
// agora entregue de um aparelho pro outro: alguém sorteia PARA o parceiro
// responder, e a vez alterna a cada rodada.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError, sortItem } from "./utilitarios";

export const VERDADES = [
  "Qual foi o momento mais feliz que você viveu com seu amor?",
  "O que você mais admira no seu parceiro(a)?",
  "Qual a primeira coisa que pensou quando viu seu amor pela primeira vez?",
  "Se pudesse voltar no tempo, que momento com seu amor reviveria?",
  "Qual música te lembra seu relacionamento?",
  "O que seu amor faz que te derrete?",
  "Qual sonho vocês dois ainda vão realizar juntos?",
  "Qual foi o presente mais especial que recebeu do seu amor?",
  "O que mudou na sua vida desde que conheceu seu amor?",
  "Qual qualidade do seu parceiro(a) você gostaria de ter?",
  "Qual foi a última vez que você riu até chorar com seu amor?",
  "O que você faria num dia perfeito ao lado dele(a)?",
];

export const DESAFIOS = [
  "Grave um áudio de 10 segundos declarando seu amor",
  "Escreva uma cartinha de amor em 2 minutos e leia em voz alta pro parceiro depois",
  "Mande uma foto engraçada sua agora mesmo",
  "Escreva um poema de 4 linhas sobre seu amor",
  "Conte a história de como vocês se conheceram em 3 frases",
  "Descreva seu amor usando só emojis",
  "Faça uma promessa para o futuro de vocês e mande por escrito",
  "Cante (ou digite a letra de) um trecho de uma música que lembre vocês",
  "Elogie seu parceiro(a) com uma palavra que comece com a primeira letra do nome dele(a)",
  "Conte uma lembrança engraçada que vocês viveram juntos",
];

export type VerdadeState = {
  turnUserId: string; // quem RESPONDE agora
  current: { kind: "verdade" | "desafio"; prompt: string } | null;
  rounds: number;
  history: { userId: string; kind: "verdade" | "desafio"; prompt: string; skipped: boolean }[];
};

export const verdade: GameModule<VerdadeState> = {
  label: "Jogo da Verdade",
  desc: "Verdade ou desafio, à distância — sem fugir",
  simultaneous: false,

  createInitialState(_hostId, guestId) {
    return { turnUserId: guestId, current: null, rounds: 0, history: [] };
  },

  initialTurn(_h, _g, state) {
    return state.turnUserId;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<VerdadeState>): MoveResult<VerdadeState> {
    const outro = userId === hostId ? guestId : hostId;

    if (move.type === "sortear") {
      if (state.current) throw new MoveError("Já tem uma pergunta em aberto.");
      // Só quem NÃO está respondendo sorteia — é quem "provoca" o parceiro.
      if (userId === state.turnUserId) throw new MoveError("É a vez do seu par responder — espere ou peça pra ele sortear.");
      const kindPedido = move.kind === "verdade" || move.kind === "desafio" ? move.kind : null;
      const isTruth = kindPedido ? kindPedido === "verdade" : Math.random() < 0.5;
      const prompt = isTruth ? sortItem(VERDADES) : sortItem(DESAFIOS);
      return { state: { ...state, current: { kind: isTruth ? "verdade" : "desafio", prompt } } };
    }

    if (move.type === "concluir") {
      if (!state.current) throw new MoveError("Nada sorteado ainda.");
      if (state.turnUserId !== userId) throw new MoveError("Não é sua vez de responder.");
      const entry = { userId, ...state.current, skipped: false };
      return {
        state: {
          turnUserId: outro,
          current: null,
          rounds: state.rounds + 1,
          history: [...state.history.slice(-19), entry],
        },
        scoreDelta: { [userId]: 8, [outro]: 3 },
        turnUserId: outro,
      };
    }

    if (move.type === "pular") {
      if (!state.current) throw new MoveError("Nada sorteado ainda.");
      if (state.turnUserId !== userId) throw new MoveError("Não é sua vez.");
      const entry = { userId, ...state.current, skipped: true };
      return {
        state: {
          turnUserId: outro,
          current: null,
          rounds: state.rounds + 1,
          history: [...state.history.slice(-19), entry],
        },
        turnUserId: outro,
      };
    }

    throw new MoveError("Jogada desconhecida.");
  },

  sanitize(state) {
    // O convite é aberto — os dois veem a pergunta sorteada.
    return state;
  },
};
