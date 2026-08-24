// Memória do Casal — jogo visual novo (Etapa 3). Um baralho de pares vira de
// cabeça pra baixo; os dois se revezam virando duas cartas por vez, à
// distância. As faces são fotos de memórias do casal quando existem (a rota
// de aceite busca até 6 anexos); o que faltar é completado com ícones do
// jogo. O valor de cada carta só é revelado ao cliente quando ela está virada
// ou já casada — ver `sanitize`.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError, embaralhar } from "./utilitarios";

/** Ícones de reposição quando o casal ainda não tem fotos suficientes. */
export const ICONES_RESERVA = [
  "icone:carta", "icone:filme", "icone:pizza", "icone:lua",
  "icone:cafe", "icone:musica", "icone:camera", "icone:flor",
  "icone:chocolate", "icone:pata", "icone:quebracabeca", "icone:vela",
];

export type MemoriaExtra = { faces: string[] };

export type MemoriaState = {
  faces: string[]; // N valores únicos (URL de foto ou "icone:xxx")
  deck: number[]; // 2N posições -> índice em `faces`
  matched: boolean[];
  flipped: number[]; // 0, 1 ou 2 posições reveladas aguardando fechar
  turnUserId: string;
  starter: string;
  matchesByUser: Record<string, number>;
  round: number;
};

function montarBaralho(faces: string[]): number[] {
  const posicoes = faces.flatMap((_, i) => [i, i]);
  return embaralhar(posicoes);
}

export const memoria: GameModule<MemoriaState, MemoriaExtra> = {
  label: "Memória do Casal",
  desc: "Vire os pares — com fotos de vocês",
  simultaneous: false,

  createInitialState(hostId, _guestId, extra) {
    const faces = extra?.faces?.length ? extra.faces.slice(0, 8) : ICONES_RESERVA.slice(0, 6);
    return {
      faces,
      deck: montarBaralho(faces),
      matched: Array(faces.length * 2).fill(false),
      flipped: [],
      turnUserId: hostId,
      starter: hostId,
      matchesByUser: { [hostId]: 0 },
      round: 0,
    };
  },

  initialTurn(_h, _g, state) {
    return state.turnUserId;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<MemoriaState>): MoveResult<MemoriaState> {
    if (move.type === "novaRodada") {
      if (!state.matched.every(Boolean)) throw new MoveError("Ainda faltam pares nessa rodada.");
      const nextStarter = state.starter === hostId ? guestId : hostId;
      return {
        state: {
          ...state,
          deck: montarBaralho(state.faces),
          matched: Array(state.faces.length * 2).fill(false),
          flipped: [],
          turnUserId: nextStarter,
          starter: nextStarter,
          matchesByUser: { [hostId]: 0, [guestId]: 0 },
          round: state.round + 1,
        },
        turnUserId: nextStarter,
      };
    }

    if (move.type !== "virar") throw new MoveError("Jogada desconhecida.");
    if (state.turnUserId !== userId) throw new MoveError("Não é sua vez.");

    // Um par sem match fica exposto até a próxima jogada — a primeira ação
    // de quem herdou a vez é fechá-lo antes de virar uma carta nova.
    let flipped = state.flipped;
    let matched = state.matched;
    if (flipped.length === 2 && !matched[flipped[0]]) {
      flipped = [];
    }

    const idx = Number(move.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= state.deck.length) throw new MoveError("Carta inválida.");
    if (matched[idx]) throw new MoveError("Essa carta já foi encontrada.");
    if (flipped.includes(idx)) throw new MoveError("Essa carta já está virada.");

    flipped = [...flipped, idx];

    if (flipped.length === 1) {
      return { state: { ...state, flipped, matched } };
    }

    // Segunda carta da dupla — decide o par.
    const [a, b] = flipped;
    const isMatch = state.deck[a] === state.deck[b];

    if (isMatch) {
      const novoMatched = [...matched];
      novoMatched[a] = true;
      novoMatched[b] = true;
      const matchesByUser = { ...state.matchesByUser, [userId]: (state.matchesByUser[userId] ?? 0) + 1 };
      const scoreDelta: Record<string, number> = { [userId]: 15 };

      const acabou = novoMatched.every(Boolean);
      if (acabou) {
        const meus = matchesByUser[userId] ?? 0;
        const doOutro = matchesByUser[userId === hostId ? guestId : hostId] ?? 0;
        if (meus > doOutro) scoreDelta[userId] = (scoreDelta[userId] ?? 0) + 20;
        else if (doOutro > meus) {
          const outro = userId === hostId ? guestId : hostId;
          scoreDelta[outro] = (scoreDelta[outro] ?? 0) + 20;
        } else {
          scoreDelta[hostId] = (scoreDelta[hostId] ?? 0) + 10;
          scoreDelta[guestId] = (scoreDelta[guestId] ?? 0) + 10;
        }
      }

      return {
        state: { ...state, matched: novoMatched, flipped: [], matchesByUser },
        scoreDelta,
        // Acertou: joga de novo (turno não muda).
      };
    }

    // Não bateu — a vez passa, mas as duas cartas continuam visíveis até a
    // próxima jogada (regra explicada acima).
    const outro = userId === hostId ? guestId : hostId;
    return {
      state: { ...state, flipped, turnUserId: outro },
      turnUserId: outro,
    };
  },

  sanitize(state) {
    const board = state.deck.map((faceIdx, i) =>
      state.matched[i] || state.flipped.includes(i) ? state.faces[faceIdx] : null
    );
    return {
      board,
      matched: state.matched,
      flipped: state.flipped,
      matchesByUser: state.matchesByUser,
      round: state.round,
      totalPairs: state.faces.length,
    };
  },
};
