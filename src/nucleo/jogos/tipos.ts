// Contrato que todo jogo em dupla (multiplayer, via GameSession) implementa.
//
// Cada jogo é um redutor puro e síncrono: recebe o estado atual + a jogada,
// devolve o novo estado + a pontuação ganha nessa jogada. Nada aqui toca o
// banco — quem persiste é a rota (`/api/jogos/[id]/jogada`). Isso mantém a
// lógica de cada jogo testável sem servidor e fácil de auditar.

export type MoveCtx<TState = any, TMove = any> = {
  state: TState;
  /** Quem está jogando agora. */
  userId: string;
  hostId: string;
  guestId: string;
  move: TMove;
};

export type MoveResult<TState = any> = {
  state: TState;
  /** Pontos ganhos NESSA jogada, por usuário. Omitir = ninguém pontuou. */
  scoreDelta?: Record<string, number>;
  /**
   * De quem é a vez agora. `undefined` = não mexe no campo (jogo simultâneo,
   * sem turno). `null` = limpa o turno.
   */
  turnUserId?: string | null;
};

export interface GameModule<TState = any, TExtra = any> {
  /** Nome exibido em convites, cabeçalhos e no seletor de jogos. */
  label: string;
  /** Frase curta pro card do jogo. */
  desc: string;
  /** true = os dois jogam ao mesmo tempo; false = jogo por turnos. */
  simultaneous: boolean;
  /**
   * Estado inicial da sessão, montado no aceite do convite. `extra` carrega
   * dados que só a rota consegue buscar (ex.: fotos do casal para a Memória).
   */
  createInitialState(hostId: string, guestId: string, extra?: TExtra): TState;
  /** Quem começa jogando (ou null se o jogo for simultâneo). */
  initialTurn(hostId: string, guestId: string, state: TState): string | null;
  /** Aplica uma jogada. Lança `MoveError` (ver util.ts) se for inválida. */
  applyMove(ctx: MoveCtx<TState>): MoveResult<TState>;
  /**
   * Remove do estado o que o `viewerId` ainda não pode ver (carta virada pro
   * outro lado, palavra secreta do desenho...). Chamada antes de toda
   * resposta ao cliente — nunca deixe segredo vazar pela rede.
   */
  sanitize(state: TState, viewerId: string, hostId: string, guestId: string): any;
}

/**
 * O formato que a API devolve pro cliente (GET, aceitar, jogada, sair...).
 * Vive aqui — não em `lib/gameSession.ts` — porque esse arquivo não é
 * `server-only`: componentes de cliente importam só o tipo (`import type`),
 * que o TypeScript apaga na compilação, sem puxar nenhum código de servidor.
 */
export type SessionDTO = {
  id: string;
  game: string;
  gameLabel: string;
  status: "pending" | "active" | "finished" | "abandoned";
  meId: string;
  isHost: boolean;
  me: { id: string; name: string; avatarColor: string; avatarUrl: string | null };
  partner: { id: string; name: string; avatarColor: string; avatarUrl: string | null };
  turnUserId: string | null;
  isMyTurn: boolean;
  myScore: number;
  partnerScore: number;
  state: any;
  partnerOnline: boolean;
  endedReason: string | null;
  endedById: string | null;
  createdAt: string;
  acceptedAt: string | null;
  finishedAt: string | null;
};
