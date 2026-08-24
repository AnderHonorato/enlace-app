"use client";

/**
 * Pistas em Cartaz — o tabuleiro.
 *
 * Mesmo formato simultâneo do Complete a Frase (ver `CompleteBoard.tsx` para
 * a explicação completa de por que `sessao.isMyTurn` não serve aqui). A
 * diferença é o que `filmeemoji.sanitize` esconde: antes de `revealed`, a
 * escolha do parceiro chega como `true`/`false` (respondeu ou não) e
 * `correctIndex` chega `null` — o gabarito só existe no servidor até os dois
 * responderem. A tela nunca sabe qual é a certa antes disso.
 */

import { motion } from "framer-motion";
import { Check, X, Zap } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { EASE_OUT } from "@/nucleo/movimento";
import { Etiqueta } from "../Papelaria";
import { GameArt } from "../ArteJogo";

type Resposta = { idx: number; at: number };

type EstadoFilmeEmoji = {
  round: number;
  question: { clues?: string[]; options: string[] };
  correctIndex: number | null;
  answers: Record<string, Resposta | boolean | null>;
  revealed: boolean;
};

export function FilmeEmojiBoard({
  estado,
  meId,
  parceiroNome,
  ocupado,
  onJogar,
}: {
  estado: EstadoFilmeEmoji;
  /** `sessao.meId` — a chave que identifica "minha" escolha dentro de `estado.answers`. */
  meId: string;
  parceiroNome: string;
  ocupado?: boolean;
  onJogar: (move: Record<string, unknown>) => void;
}) {
  const outroId = Object.keys(estado.answers).find((id) => id !== meId) ?? "";
  const meuValor = estado.answers[meId];
  const meuResp = meuValor && typeof meuValor === "object" ? (meuValor as Resposta) : null;
  const jaRespondi = meuResp != null;
  const outroValor = estado.answers[outroId];
  const outroResp = estado.revealed && outroValor && typeof outroValor === "object" ? (outroValor as Resposta) : null;

  function escolher(idx: number) {
    if (jaRespondi || estado.revealed || ocupado) return;
    onJogar({ type: "responder", idx });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="kicker-sm">Rodada {estado.round + 1}</span>
        <span className="kicker-sm">
          {estado.revealed ? "revelado" : jaRespondi ? "esperando resposta" : "escolha um filme"}
        </span>
      </div>

      <div className="grid grid-cols-[110px_1fr] items-center gap-3 rounded-2xl border border-border2 bg-bg2 px-3 py-4 sm:grid-cols-[150px_1fr]">
        <span className="block h-24 text-text" aria-hidden><GameArt kind="film" /></span>
        <div className="grid gap-1.5">
          {(estado.question.clues?.length ? estado.question.clues : ["cena", "personagem", "objeto"]).map((clue, index) => (
            <span key={`${clue}-${index}`} className="border border-border2 bg-surface px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-text">
              pista {index + 1} · {clue}
            </span>
          ))}
        </div>
        {!estado.revealed && jaRespondi ? (
          <div className="col-span-2 flex items-center justify-center gap-2">
            <PulsoEspera />
            <span className="kicker-sm">esperando {parceiroNome}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2">
        {estado.question.options.map((opt, idx) => (
          <Opcao
            key={idx}
            texto={opt}
            idx={idx}
            selecionadaPorMim={meuResp?.idx === idx}
            selecionadaPeloOutro={outroResp?.idx === idx}
            correta={estado.revealed && idx === estado.correctIndex}
            revelado={estado.revealed}
            desabilitado={jaRespondi || estado.revealed || Boolean(ocupado)}
            parceiroNome={parceiroNome}
            onClick={() => escolher(idx)}
          />
        ))}
      </div>

      {estado.revealed ? (
        <Resultado
          correctIndex={estado.correctIndex}
          meuResp={meuResp}
          outroResp={outroResp}
          parceiroNome={parceiroNome}
          ocupado={ocupado}
          onJogar={onJogar}
        />
      ) : null}
    </div>
  );
}

function Opcao({
  texto,
  idx,
  selecionadaPorMim,
  selecionadaPeloOutro,
  correta,
  revelado,
  desabilitado,
  parceiroNome,
  onClick,
}: {
  texto: string;
  idx: number;
  selecionadaPorMim: boolean;
  selecionadaPeloOutro: boolean;
  correta: boolean;
  revelado: boolean;
  desabilitado: boolean;
  parceiroNome: string;
  onClick: () => void;
}) {
  const errouEEuFui = revelado && selecionadaPorMim && !correta;

  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      aria-pressed={selecionadaPorMim}
      className={cn(
        "flex min-h-[44px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-medium transition-colors",
        revelado
          ? correta
            ? "border-success/45 bg-success/[0.08] text-success"
            : errouEEuFui
              ? "border-danger/45 bg-danger/[0.08] text-danger"
              : "border-border2 bg-surface text-faint"
          : selecionadaPorMim
            ? "border-accent bg-accent/[0.07] text-text"
            : "border-border2 bg-surface text-text",
        !desabilitado && "hover:border-text"
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
            correta ? "border-success text-success" : errouEEuFui ? "border-danger text-danger" : "border-border2 text-faint"
          )}
        >
          {correta ? <Check size={12} /> : errouEEuFui ? <X size={12} /> : String.fromCharCode(65 + idx)}
        </span>
        <span className="truncate">{texto}</span>
      </span>
      {selecionadaPorMim || selecionadaPeloOutro ? (
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {selecionadaPorMim ? <span className="kicker-sm text-accentInk">você</span> : null}
          {selecionadaPeloOutro ? <span className="kicker-sm truncate">{parceiroNome}</span> : null}
        </span>
      ) : null}
    </button>
  );
}

/** Nunca deve parecer travado: os pontinhos deixam claro que o jogo está vivo, só esperando o outro lado. */
function PulsoEspera() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: EASE_OUT, delay: i * 0.16 }}
        />
      ))}
    </span>
  );
}

function Resultado({
  correctIndex,
  meuResp,
  outroResp,
  parceiroNome,
  ocupado,
  onJogar,
}: {
  correctIndex: number | null;
  meuResp: Resposta | null;
  outroResp: Resposta | null;
  parceiroNome: string;
  ocupado?: boolean;
  onJogar: (move: Record<string, unknown>) => void;
}) {
  const meuCorreto = meuResp != null && meuResp.idx === correctIndex;
  const outroCorreto = outroResp != null && outroResp.idx === correctIndex;
  const maisRapido =
    meuCorreto && outroCorreto ? (meuResp!.at <= outroResp!.at ? "voce" : "outro") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.15 }}
      className="mt-3 flex flex-col items-center gap-3 text-center"
    >
      {maisRapido ? (
        <Etiqueta tone="accent">
          <Zap size={12} />
          {maisRapido === "voce" ? "Você foi mais rápido — +5" : `${parceiroNome} foi mais rápido — +5`}
        </Etiqueta>
      ) : null}
      <button
        onClick={() => onJogar({ type: "proxima" })}
        disabled={ocupado}
        className="sheen inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-text px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-50"
      >
        Próximo filme
      </button>
    </motion.div>
  );
}
