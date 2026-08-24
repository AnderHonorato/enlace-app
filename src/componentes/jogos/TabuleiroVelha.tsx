"use client";

/**
 * Jogo da Velha do Amor — o tabuleiro.
 *
 * `velha.sanitize` devolve o estado inteiro (o tabuleiro é público, nada a
 * esconder) — cada célula guarda o userId de quem marcou, não um "X"/"O".
 * Quem decide o símbolo é este componente, do ponto de vista de quem olha:
 * a MINHA marca é sempre um coração desenhado e a do meu par um losango. Os dois aparelhos
 * mostram o mesmo tabuleiro com os símbolos trocados entre si, e está tudo
 * bem — é decoração por cima do dado; o servidor nunca soube de corações.
 *
 * A partida em si (`GameSession`) não termina sozinha quando alguém vence —
 * só quando um dos dois sai. `winner` fecha a RODADA, não a sessão: por isso
 * o painel de resultado mora aqui dentro (não em `JogoSessao`) e o botão
 * "Próxima rodada" manda `{ type: "novaRodada" }`, que o redutor aceita de
 * qualquer um dos dois, a qualquer momento após decidido o vencedor.
 */

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { EASE_OUT } from "@/nucleo/movimento";
import { cn } from "@/nucleo/utilitarios";

type EstadoVelha = {
  board: (string | null)[];
  turn: string;
  starter: string;
  winner: string | "empate" | null;
  winLine: number[];
  rounds: number;
};

export function VelhaBoard({
  estado,
  meId,
  parceiroNome,
  minhaVez,
  ocupado,
  onJogar,
}: {
  estado: EstadoVelha;
  /** `sessao.meId` decide qual marca vetorial pertence a quem. */
  meId: string;
  parceiroNome: string;
  minhaVez: boolean;
  ocupado?: boolean;
  onJogar: (move: Record<string, any>) => void;
}) {
  const { board, winner, winLine, rounds } = estado;
  const acabou = winner !== null;
  const venceuEu = winner !== null && winner !== "empate" && winner === meId;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="kicker-sm">Rodada {rounds + 1}</span>
        <span className="kicker-sm">
          {acabou ? "rodada encerrada" : minhaVez ? "toque numa célula" : `vez de ${parceiroNome}`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((dono, i) => {
          const naLinha = winLine.includes(i);
          const podeClicar = minhaVez && !ocupado && !acabou && !dono;

          return (
            <button
              key={i}
              onClick={() => podeClicar && onJogar({ type: "jogar", index: i })}
              disabled={!podeClicar}
              aria-label={dono ? "Célula ocupada" : `Marcar célula ${i + 1}`}
              className={cn(
                "relative flex aspect-square w-full items-center justify-center rounded-xl border text-[28px] transition-colors",
                naLinha ? "border-accent/45 bg-accent/[0.07]" : "border-border2 bg-surface",
                podeClicar ? "cursor-pointer hover:border-text" : "cursor-default"
              )}
            >
              {dono ? (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: naLinha ? 1.08 : 1, opacity: 1 }}
                  transition={{
                    duration: 0.34,
                    ease: EASE_OUT,
                    delay: naLinha ? winLine.indexOf(i) * 0.08 : 0,
                  }}
                >
                  <Marca minha={dono === meId} />
                </motion.span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-faint">
        <Marca minha pequena /> você · <Marca pequena /> {parceiroNome}
      </p>

      <AnimatePresence>
        {acabou ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="mt-3 flex flex-col items-center gap-2.5 rounded-xl border border-border2 bg-bg2 py-4 text-center"
          >
            <span className="flex h-10 items-center justify-center text-accent" aria-hidden>
              {winner === "empate" ? <Empate /> : <Marca minha={venceuEu} />}
            </span>
            <p className="text-[13.5px] font-semibold text-text">
              {winner === "empate"
                ? "Empate nessa rodada"
                : venceuEu
                  ? "Você venceu essa rodada!"
                  : `${parceiroNome} venceu essa rodada!`}
            </p>
            <button
              onClick={() => onJogar({ type: "novaRodada" })}
              disabled={ocupado}
              className="sheen mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-text px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
            >
              <RotateCcw size={14} /> Próxima rodada
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Marca({ minha = false, pequena = false }: { minha?: boolean; pequena?: boolean }) {
  const size = pequena ? 16 : 34;
  return minha ? (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="rgb(var(--accent) / .16)" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20C4 15.5 3 10 6 7.4c2.2-1.9 4.8-.8 6 1.2 1.2-2 3.8-3.1 6-1.2 3 2.6 2 8.1-6 12.6Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="rgb(var(--warning) / .15)" stroke="rgb(var(--warning))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 8 9-8 9-8-9 8-9Z" />
      <path d="m8 12 4-4 4 4-4 4-4-4Z" />
    </svg>
  );
}

function Empate() {
  return <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 9h14M5 15h14" /></svg>;
}
