// Pistas de Cinema em dupla remota — mesma pergunta pros dois ao mesmo
// tempo, resposta escondida até ambos responderem (ou vaza a corrida), e um
// bônus de velocidade pra quem acerta primeiro.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError, embaralhar } from "./utilitarios";

type Questao = { clues: [string, string, string]; options: string[]; correct: number };

const FILMES: Questao[] = [
  { clues: ["savana", "herdeiro", "pedra"], options: ["O Rei Leão", "Madagascar", "Tarzan", "Mogli"], correct: 0 },
  { clues: ["transatlântico", "colar azul", "iceberg"], options: ["Titanic", "Poseidon", "Mar em Fúria", "O Naufrágio"], correct: 0 },
  { clues: ["cicatriz", "escola de magia", "castelo"], options: ["Harry Potter", "Senhor dos Anéis", "As Crônicas de Nárnia", "Percy Jackson"], correct: 0 },
  { clues: ["anel", "vulcão", "jornada"], options: ["Senhor dos Anéis", "Game of Thrones", "Vikings", "O Hobbit"], correct: 0 },
  { clues: ["Paris", "cozinha", "pequeno chef"], options: ["Ratatouille", "Kung Fu Panda", "Zootopia", "O Rei Leão"], correct: 0 },
  { clues: ["assombração", "equipe", "capturador"], options: ["Ghostbusters", "Atividade Paranormal", "Invocação do Mal", "Sexto Sentido"], correct: 0 },
  { clues: ["âmbar", "parque", "dinossauros"], options: ["Jurassic Park", "Godzilla", "King Kong", "Planeta dos Macacos"], correct: 0 },
  { clues: ["duas irmãs", "reino", "gelo"], options: ["Frozen", "Valente", "Moana", "Enrolados"], correct: 0 },
  { clues: ["máscara", "teia", "cidade"], options: ["Homem-Aranha", "Batman", "Homem de Ferro", "Deadpool"], correct: 0 },
  { clues: ["milharal", "relógio", "espaço"], options: ["Interestelar", "Gravidade", "Perdido em Marte", "2001: Odisseia no Espaço"], correct: 0 },
  { clues: ["casa", "balões", "viagem"], options: ["Up: Altas Aventuras", "Wall-E", "Toy Story", "Meu Malvado Favorito"], correct: 0 },
  { clues: ["dança", "guarda-chuva", "Hollywood"], options: ["Cantando na Chuva", "Grease", "Dirty Dancing", "La La Land"], correct: 0 },
  { clues: ["recife", "pai", "oceano"], options: ["Procurando Nemo", "O Espanta Tubarões", "A Pequena Sereia", "Peixe Grande"], correct: 0 },
  { clues: ["herói noturno", "caos", "grande cidade"], options: ["Batman: O Cavaleiro das Trevas", "Coringa", "Suicide Squad", "Watchmen"], correct: 0 },
  { clues: ["macarrão", "artes marciais", "guerreiro"], options: ["Kung Fu Panda", "Madagascar", "A Era do Gelo", "Shrek"], correct: 0 },
  { clues: ["praia", "ataque", "barco"], options: ["Tubarão", "Soul Surfer", "Caçadores de Emoção", "O Espanta Tubarões"], correct: 0 },
  { clues: ["castelo", "maldição", "chapéu"], options: ["O Castelo Animado", "Frozen 2", "Enrolados", "A Bela e a Fera"], correct: 0 },
  { clues: ["robô", "planta", "nave"], options: ["Wall-E", "Robôs", "Big Hero", "Megamente"], correct: 0 },
  { clues: ["ilha", "dragão", "amizade"], options: ["Como Treinar Seu Dragão", "O Hobbit", "Eragon", "Mulan"], correct: 0 },
  { clues: ["memórias", "emoções", "mente"], options: ["Divertida Mente", "Soul", "Viva: A Vida é uma Festa", "Enrolados"], correct: 0 },
];

export type FilmeEmojiState = {
  order: number[];
  round: number;
  question: { clues: string[]; options: string[] };
  correctIndex: number;
  answers: Record<string, { idx: number; at: number } | null>;
  revealed: boolean;
};

function montarQuestao(idx: number) {
  const q = FILMES[idx];
  return { clues: q.clues, options: q.options };
}

export const filmeemoji: GameModule<FilmeEmojiState> = {
  label: "Pistas em Cartaz",
  desc: "Adivinhem juntos — mais rápido, mais pontos",
  simultaneous: true,

  createInitialState(hostId, guestId) {
    const order = embaralhar(FILMES.map((_, i) => i));
    const first = FILMES[order[0]];
    return {
      order,
      round: 0,
      question: montarQuestao(order[0]),
      correctIndex: first.correct,
      answers: { [hostId]: null, [guestId]: null },
      revealed: false,
    };
  },

  initialTurn() {
    return null;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<FilmeEmojiState>): MoveResult<FilmeEmojiState> {
    if (move.type === "responder") {
      if (state.revealed) throw new MoveError("A resposta já foi revelada.");
      if (state.answers[userId] != null) throw new MoveError("Você já respondeu.");
      const idx = Number(move.idx);
      if (!Number.isInteger(idx) || idx < 0 || idx > 3) throw new MoveError("Opção inválida.");

      const answers = { ...state.answers, [userId]: { idx, at: Date.now() } };
      const bothAnswered = answers[hostId] != null && answers[guestId] != null;
      if (!bothAnswered) return { state: { ...state, answers } };

      const hostAns = answers[hostId]!;
      const guestAns = answers[guestId]!;
      const hostCorrect = hostAns.idx === state.correctIndex;
      const guestCorrect = guestAns.idx === state.correctIndex;
      const scoreDelta: Record<string, number> = {};
      if (hostCorrect) scoreDelta[hostId] = 10;
      if (guestCorrect) scoreDelta[guestId] = 10;
      if (hostCorrect && guestCorrect) {
        const fastest = hostAns.at <= guestAns.at ? hostId : guestId;
        scoreDelta[fastest] = (scoreDelta[fastest] ?? 0) + 5;
      }
      return { state: { ...state, answers, revealed: true }, scoreDelta };
    }

    if (move.type === "proxima") {
      if (!state.revealed) throw new MoveError("Esperem os dois responderem.");
      const round = state.round + 1;
      const order = round % state.order.length === 0 ? embaralhar(FILMES.map((_, i) => i)) : state.order;
      const idxFilme = order[round % order.length];
      const q = FILMES[idxFilme];
      return {
        state: {
          order,
          round,
          question: montarQuestao(idxFilme),
          correctIndex: q.correct,
          answers: { [hostId]: null, [guestId]: null },
          revealed: false,
        },
      };
    }

    throw new MoveError("Jogada desconhecida.");
  },

  sanitize(state, viewerId, hostId, guestId) {
    const outro = viewerId === hostId ? guestId : hostId;
    const answers: Record<string, { idx: number; at: number } | boolean | null> = {
      [viewerId]: state.answers[viewerId] ?? null,
      [outro]: state.revealed ? state.answers[outro] : state.answers[outro] != null,
    };
    return {
      ...state,
      answers,
      correctIndex: state.revealed ? state.correctIndex : null,
    };
  },
};
