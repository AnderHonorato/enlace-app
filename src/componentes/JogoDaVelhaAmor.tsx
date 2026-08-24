"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

type Cell = "❤️" | "💋" | null;
type Board = Cell[];

/**
 * O jogo identifica os times pelo símbolo, não por nome.
 *
 * Antes estavam chumbados "Anderson" e "Mauricio" — nomes que apareciam para
 * qualquer casal que usasse o app. Como o componente não recebe os nomes reais
 * e não existe rota que os devolva no cliente, chamar de Coração e Beijo é
 * honesto e vale para todo mundo.
 */
function nomeTime(simbolo: "❤️" | "💋"): string {
  return simbolo === "❤️" ? "Coração" : "Beijo";
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Board): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export function TicTacToeAmor() {
  const reduceMotion = useReducedMotion();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [startingPlayer, setStartingPlayer] = useState<"❤️" | "💋">("❤️");
  const [turn, setTurn] = useState<"❤️" | "💋">("❤️");
  const [result, setResult] = useState<"❤️" | "💋" | "velha" | null>(null);
  const [winLine, setWinLine] = useState<number[]>([]);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [hoverCell, setHoverCell] = useState<number | null>(null);

  const play = useCallback((idx: number) => {
    if (board[idx] || result) return;
    const next = [...board];
    next[idx] = turn;
    setBoard(next);

    const winner = checkWinner(next);
    if (winner) {
      setResult(winner.winner);
      setWinLine(winner.line);
      if (winner.winner === "❤️") setScoreX((s) => s + 1);
      else setScoreO((s) => s + 1);
    } else if (next.every((c) => c !== null)) {
      setResult("velha");
    } else {
      setTurn(turn === "❤️" ? "💋" : "❤️");
    }
  }, [board, turn, result]);

  const reset = () => {
    // Quem começa alterna a cada partida, pra ninguém levar vantagem sempre.
    const nextStarter = startingPlayer === "❤️" ? "💋" : "❤️";
    setStartingPlayer(nextStarter);
    setBoard(Array(9).fill(null));
    setTurn(nextStarter);
    setResult(null);
    setWinLine([]);
    setHoverCell(null);
  };

  const isWinCell = (idx: number) => winLine.includes(idx);

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl text-text">
          Jogo da <span className="gradient-text">Velha</span> do Amor
        </h2>
        <p className="mt-1 text-sm text-muted">
          ❤️ vs 💋 — vez de quem?
        </p>
      </div>

      <div className="mx-auto max-w-xs">
        {/* Placar acumulado — persiste entre partidas, só zera se resetar a página */}
        <div className="mb-4 flex items-center justify-center gap-6 rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">❤️</span>
            <span className="text-xs font-bold text-accent">{scoreX}</span>
          </div>
          <span className="text-sm text-faint">×</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">💋</span>
            <span className="text-xs font-bold text-warning">{scoreO}</span>
          </div>
        </div>

        {/* Indicador de turno */}
        {!result && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-faint">Vez de</span>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold",
              turn === "❤️" ? "border-accent/50 text-accent bg-accent/10" : "border-warning/50 text-warning bg-warning/10"
            )}>
              {turn} {nomeTime(turn)}
            </span>
          </div>
        )}

        {/* Tabuleiro */}
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, idx) => {
            const winning = isWinCell(idx);
            const winOrder = winning ? winLine.indexOf(idx) : -1;
            return (
              <motion.button
                key={idx}
                onClick={() => play(idx)}
                onMouseEnter={() => setHoverCell(idx)}
                onMouseLeave={() => setHoverCell(null)}
                whileTap={!cell && !result ? { scale: 0.9 } : {}}
                animate={
                  winning && !reduceMotion
                    ? { scale: [1, 1.08, 1.03] }
                    : { scale: 1 }
                }
                transition={
                  winning
                    ? { ...spring.bouncy, delay: winOrder * 0.08 }
                    : spring.snappy
                }
                className={cn(
                  "flex h-24 w-full items-center justify-center rounded-2xl border-2 text-4xl transition-colors",
                  cell
                    ? winning
                      ? "border-warning bg-warning/15 shadow-[0_0_18px_rgb(var(--warning)/0.45)]"
                      : "border-border bg-surface2"
                    : result
                      ? "border-border bg-surface cursor-default"
                      : "border-border bg-surface hover:border-accent/40 hover:bg-surface2 cursor-pointer",
                )}
              >
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={spring.bouncy}
                  >
                    {cell}
                  </motion.span>
                )}
                {!cell && !result && hoverCell === idx && (
                  <span className="opacity-20">{turn}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Resultado */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring.snappy}
              className="mt-4 card flex flex-col items-center gap-3 p-5 text-center"
            >
              {result === "velha" ? (
                <>
                  <div className="text-3xl">🤝</div>
                  <div className="font-display text-xl text-text">Empate!</div>
                  <p className="text-sm text-muted">Ninguém ganhou dessa vez</p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={reduceMotion ? undefined : { scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl"
                  >
                    {result}
                  </motion.div>
                  <div className={cn("font-display text-xl", result === "❤️" ? "text-accent" : "text-warning")}>
                    {nomeTime(result)} venceu!
                  </div>
                </>
              )}
              <p className="text-xs text-faint">
                Próxima partida começa com{" "}
                {startingPlayer === "❤️" ? `💋 ${nomeTime("💋")}` : `❤️ ${nomeTime("❤️")}`}
              </p>
              <button
                onClick={reset}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-110"
              >
                <RotateCcw size={17} /> Jogar de novo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
