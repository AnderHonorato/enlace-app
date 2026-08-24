// Desenho & Adivinha — jogo visual novo (Etapa 3). Um dos dois recebe uma
// palavra secreta e desenha num canvas; o outro vê os traços chegarem (via
// polling — não há websocket neste projeto, então o desenho aparece em lotes,
// não traço a traço) e tenta adivinhar. Acertou, os dois pontuam e trocam de
// papel.
import type { GameModule, MoveCtx, MoveResult } from "./tipos";
import { MoveError, normalizar, sortItem } from "./utilitarios";

export const PALAVRAS = [
  "coração", "praia", "viagem", "bolo", "guarda-chuva", "gato", "cachorro",
  "flor", "sol", "lua", "estrela", "casa", "carro", "bicicleta", "avião",
  "presente", "anel", "vela", "livro", "café", "pizza", "sorvete", "chuva",
  "árvore", "montanha", "borboleta", "violão", "chapéu", "óculos", "relógio",
  "beijo", "abraço", "dança", "piquenique", "fogueira", "arco-íris", "nuvem",
  "pipoca", "chave", "carta",
];

export type Traco = { pontos: [number, number][]; cor: string; largura: number };

export type DesenhoState = {
  turnUserId: string; // quem desenha agora
  palavra: string;
  tracos: Traco[];
  palpites: { userId: string; texto: string; at: number; correto: boolean }[];
  resolvido: boolean;
  desistiu: boolean;
  rounds: number;
  usadas: string[]; // últimas palavras, pra não repetir
};

function novaPalavra(usadas: string[]): string {
  const disponiveis = PALAVRAS.filter((p) => !usadas.includes(p));
  return sortItem(disponiveis.length ? disponiveis : PALAVRAS);
}

export const desenho: GameModule<DesenhoState> = {
  label: "Desenho & Adivinha",
  desc: "Um desenha, o outro adivinha — em tempo real",
  simultaneous: false,

  createInitialState(hostId) {
    const palavra = novaPalavra([]);
    return {
      turnUserId: hostId,
      palavra,
      tracos: [],
      palpites: [],
      resolvido: false,
      desistiu: false,
      rounds: 0,
      usadas: [palavra],
    };
  },

  initialTurn(_h, _g, state) {
    return state.turnUserId;
  },

  applyMove({ state, userId, hostId, guestId, move }: MoveCtx<DesenhoState>): MoveResult<DesenhoState> {
    const outro = userId === hostId ? guestId : hostId;

    if (move.type === "traco") {
      if (state.resolvido) throw new MoveError("A rodada já terminou.");
      if (state.turnUserId !== userId) throw new MoveError("Só quem desenha pode traçar.");
      const pontosBrutos = Array.isArray(move.pontos) ? move.pontos : [];
      const pontos: [number, number][] = pontosBrutos
        .slice(0, 250)
        .map((p: any) => [Number(p?.[0]) || 0, Number(p?.[1]) || 0]);
      if (pontos.length < 2) throw new MoveError("Traço vazio.");
      if (state.tracos.length >= 500) throw new MoveError("Muitos traços — limpe o quadro.");
      const cor = typeof move.cor === "string" ? move.cor.slice(0, 20) : "#17140F";
      const largura = Number(move.largura) || 4;
      const traco: Traco = { pontos, cor, largura: Math.min(24, Math.max(1, largura)) };
      return { state: { ...state, tracos: [...state.tracos, traco] } };
    }

    if (move.type === "limpar") {
      if (state.resolvido) throw new MoveError("A rodada já terminou.");
      if (state.turnUserId !== userId) throw new MoveError("Só quem desenha pode limpar.");
      return { state: { ...state, tracos: [] } };
    }

    if (move.type === "chutar") {
      if (state.resolvido) throw new MoveError("A rodada já terminou.");
      if (state.turnUserId === userId) throw new MoveError("Quem desenha não chuta.");
      const texto = String(move.texto ?? "").trim().slice(0, 60);
      if (!texto) throw new MoveError("Escreva um palpite.");
      const correto = normalizar(texto) === normalizar(state.palavra);
      const palpites = [...state.palpites.slice(-19), { userId, texto, at: Date.now(), correto }];
      if (!correto) {
        return { state: { ...state, palpites } };
      }
      return {
        state: { ...state, palpites, resolvido: true },
        scoreDelta: { [userId]: 15, [state.turnUserId]: 10 },
      };
    }

    if (move.type === "desistir") {
      if (state.resolvido) throw new MoveError("A rodada já terminou.");
      if (state.turnUserId !== userId) throw new MoveError("Só quem desenha pode desistir.");
      return { state: { ...state, resolvido: true, desistiu: true } };
    }

    if (move.type === "novaRodada") {
      if (!state.resolvido) throw new MoveError("A rodada ainda não acabou.");
      const palavra = novaPalavra(state.usadas);
      return {
        state: {
          turnUserId: outro,
          palavra,
          tracos: [],
          palpites: [],
          resolvido: false,
          desistiu: false,
          rounds: state.rounds + 1,
          usadas: [...state.usadas.slice(-6), palavra],
        },
        turnUserId: outro,
      };
    }

    throw new MoveError("Jogada desconhecida.");
  },

  sanitize(state, viewerId) {
    const podeVerPalavra = viewerId === state.turnUserId || state.resolvido;
    return { ...state, palavra: podeVerPalavra ? state.palavra : null };
  },
};
