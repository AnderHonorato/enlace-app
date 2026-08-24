// Registro central dos jogos em dupla remota. Toda rota de /api/jogos passa
// por aqui pra achar o redutor certo — nada de `switch` espalhado.
import type { GameModule } from "./tipos";
import { velha } from "./velha";
import { verdade } from "./verdade";
import { complete } from "./completar-frase";
import { filmeemoji } from "./pistas-cinema";
import { memoria } from "./memoria";
import { desenho } from "./desenho";

const registro = { velha, verdade, complete, filmeemoji, memoria, desenho };

export type GameSlug = keyof typeof registro;

/**
 * Tipado como `GameModule<any, any>` de propósito: cada jogo tem seu próprio
 * formato de estado (`VelhaState`, `VerdadeState`...), e o TypeScript não
 * consegue expressar "uma função que aceita QUALQUER um desses formatos,
 * dependendo da chave" sem apelar pra `any` aqui na borda do registro. Dentro
 * de cada arquivo de jogo (velha.ts, memoria.ts...) o tipo continua forte.
 */
export const GAMES: Record<GameSlug, GameModule<any, any>> = registro;

export function isGameSlug(v: string): v is GameSlug {
  return Object.prototype.hasOwnProperty.call(GAMES, v);
}

export const GAME_SLUGS = Object.keys(GAMES) as GameSlug[];

export { MoveError } from "./utilitarios";
export type { GameModule, MoveCtx, MoveResult } from "./tipos";
