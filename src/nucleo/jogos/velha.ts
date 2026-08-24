// Jogo da Velha do Amor, em dupla remota — mesmo tabuleiro de TicTacToeAmor.tsx,
// agora por turnos entre dois aparelhos em vez de pass-and-play num só.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError } from "./utilitarios";

export type VelhaCell = string | null; // userId do dono da célula, ou null
export type VelhaState = {
  board: VelhaCell[];
  turn: string;
  starter: string;
  winner: string | "empate" | null;
  winLine: number[];
  rounds: number;
};

const LINHAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checarVencedor(board: VelhaCell[]) {
  for (const linha of LINHAS) {
    const [a, b, c] = linha;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as string, linha };
    }
  }
  return null;
}

export const velha: GameModule<VelhaState> = {
  label: "Jogo da Velha do Amor",
  desc: "Três em linha por turnos, à distância",
  simultaneous: false,

  createInitialState(hostId) {
    return {
      board: Array(9).fill(null),
      turn: hostId,
      starter: hostId,
      winner: null,
      winLine: [],
      rounds: 0,
    };
  },

  initialTurn(_h, _g, state) {
    return state.turn;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<VelhaState>): MoveResult<VelhaState> {
    if (move.type === "novaRodada") {
      if (!state.winner) throw new MoveError("A rodada ainda não acabou.");
      const nextStarter = state.starter === hostId ? guestId : hostId;
      return {
        state: {
          board: Array(9).fill(null),
          turn: nextStarter,
          starter: nextStarter,
          winner: null,
          winLine: [],
          rounds: state.rounds + 1,
        },
        turnUserId: nextStarter,
      };
    }

    if (move.type !== "jogar") throw new MoveError("Jogada desconhecida.");
    if (state.winner) throw new MoveError("Essa rodada já terminou — comecem outra.");
    if (state.turn !== userId) throw new MoveError("Não é sua vez.");
    const idx = Number(move.index);
    if (!Number.isInteger(idx) || idx < 0 || idx > 8) throw new MoveError("Célula inválida.");
    if (state.board[idx]) throw new MoveError("Essa célula já está ocupada.");

    const board = [...state.board];
    board[idx] = userId;
    const found = checarVencedor(board);
    const cheia = board.every((c) => c !== null);
    const other = userId === hostId ? guestId : hostId;

    if (found) {
      return {
        state: { ...state, board, winner: found.winner, winLine: found.linha },
        scoreDelta: { [userId]: 10 },
        turnUserId: null,
      };
    }
    if (cheia) {
      return {
        state: { ...state, board, winner: "empate", winLine: [] },
        scoreDelta: { [hostId]: 3, [guestId]: 3 },
        turnUserId: null,
      };
    }
    return {
      state: { ...state, board, turn: other },
      turnUserId: other,
    };
  },

  sanitize(state) {
    // Tabuleiro é público — nada a esconder.
    return state;
  },
};
