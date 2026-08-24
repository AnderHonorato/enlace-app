"use client";

/**
 * Jogo da Verdade — o tabuleiro.
 *
 * `verdade.sanitize` devolve o estado inteiro — o convite é aberto, os dois
 * veem a pergunta sorteada assim que ela existe. O papel de cada um troca
 * conforme `current`:
 *
 *   current === null  → quem NÃO está em `turnUserId` sorteia (provoca o
 *                        parceiro); quem está, espera ser sorteado.
 *   current !== null  → quem está em `turnUserId` responde ou pula;
 *                        quem sorteou espera a resposta chegar.
 *
 * `souEuQuemResponde` segue a mesma convenção de `sessao.isMyTurn`
 * (`turnUserId === meId`) — só que aqui, ao contrário da Velha, NINGUÉM
 * fica parado esperando sem ação possível: um dos dois sempre tem um botão
 * pra apertar, seja sortear, responder ou pular. É por isso que a tela nunca
 * mostra um estado "travado" — sempre existe algo pra fazer, mesmo que seja
 * só esperar o outro lado (e mesmo aí, isso fica escrito).
 */

import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Check, SkipForward, Sparkles } from "lucide-react";
import { EASE_OUT } from "@/nucleo/movimento";
import { cn } from "@/nucleo/utilitarios";
import { Etiqueta } from "../Papelaria";

type EstadoVerdade = {
  turnUserId: string;
  current: { kind: "verdade" | "desafio"; prompt: string } | null;
  rounds: number;
  history: { userId: string; kind: "verdade" | "desafio"; prompt: string; skipped: boolean }[];
};

export function VerdadeBoard({
  estado,
  meId,
  parceiroNome,
  souEuQuemResponde,
  ocupado,
  onJogar,
}: {
  estado: EstadoVerdade;
  meId: string;
  parceiroNome: string;
  /** true quando EU sou quem responde agora (`estado.turnUserId === meId`). */
  souEuQuemResponde: boolean;
  ocupado?: boolean;
  onJogar: (move: Record<string, any>) => void;
}) {
  const { current, rounds, history } = estado;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="kicker-sm">Rodada {rounds + 1}</span>
        <span className="kicker-sm">
          {current
            ? souEuQuemResponde
              ? "sua vez de responder"
              : `vez de ${parceiroNome} responder`
            : souEuQuemResponde
              ? `esperando ${parceiroNome} sortear`
              : "sua vez de sortear"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!current ? (
          souEuQuemResponde ? (
            <motion.div
              key="espera-sorteio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border2 bg-bg2 py-8 text-center"
            >
              <Shuffle size={20} className="text-faint" strokeWidth={1.5} />
              <p className="max-w-[30ch] text-[13.5px] text-muted">
                {parceiroNome} está escolhendo uma verdade ou desafio para você.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sorteio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              className="flex flex-col items-center gap-3 rounded-xl border border-border2 bg-bg2 px-4 py-6 text-center"
            >
              <p className="max-w-[32ch] text-[13.5px] text-muted">
                Sorteie uma verdade ou um desafio para {parceiroNome}.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onJogar({ type: "sortear", kind: "verdade" })}
                  disabled={ocupado}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border2 bg-surface px-4 text-[12.5px] font-semibold text-text transition-colors hover:bg-surface2 disabled:opacity-60"
                >
                  Verdade
                </button>
                <button
                  onClick={() => onJogar({ type: "sortear", kind: "desafio" })}
                  disabled={ocupado}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border2 bg-surface px-4 text-[12.5px] font-semibold text-text transition-colors hover:bg-surface2 disabled:opacity-60"
                >
                  Desafio
                </button>
                <button
                  onClick={() => onJogar({ type: "sortear" })}
                  disabled={ocupado}
                  className="sheen inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-text px-4 text-[12.5px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <Sparkles size={13} /> Surpreenda
                </button>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            key="pergunta"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="rounded-xl border border-border2 bg-surface p-5"
          >
            <Etiqueta tone={current.kind === "verdade" ? "accent" : "ink"}>
              {current.kind === "verdade" ? "Verdade" : "Desafio"}
            </Etiqueta>
            <p className="mt-3 font-display text-[19px] leading-snug tracking-[-0.015em] text-text">
              {current.prompt}
            </p>

            {souEuQuemResponde ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => onJogar({ type: "concluir" })}
                  disabled={ocupado}
                  className="sheen inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-text px-4 text-[12.5px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <Check size={14} /> Concluí
                </button>
                <button
                  onClick={() => onJogar({ type: "pular" })}
                  disabled={ocupado}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border2 px-4 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-60"
                >
                  <SkipForward size={14} /> Pular
                </button>
              </div>
            ) : (
              <p className="kicker-sm mt-4">esperando resposta de {parceiroNome}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 ? (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {history
            .slice(-6)
            .reverse()
            .map((h, i) => (
              <span
                key={i}
                title={h.prompt}
                className={cn(
                  "kicker-sm shrink-0 whitespace-nowrap rounded-md border px-2 py-1",
                  h.skipped ? "border-border2 text-faint" : "border-accent/25 bg-accent/[0.06] text-accentInk"
                )}
              >
                {h.userId === meId ? "você" : parceiroNome} · {h.kind}
                {h.skipped ? " · pulou" : ""}
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}
