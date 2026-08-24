"use client";

/**
 * A casca de toda partida em dupla.
 *
 * O pedido era explícito: "pontuação exibir dentro de cada sessão de jogo, não
 * somente na página geral". Então o placar dos DOIS mora aqui, sempre visível,
 * junto de quem está na vez — e não numa tela separada.
 *
 * Ela cobre os quatro estados que o servidor pode devolver:
 *
 *   pending   → quem convidou espera; quem foi convidado aceita ou recusa
 *   active    → placar + vez + o tabuleiro do jogo (vem por `children`)
 *   finished  → resumo, com o motivo (alguém saiu? acabou de verdade?)
 *   abandoned → mesma tela de fim, com o texto certo
 *
 * O tabuleiro em si é responsabilidade de cada jogo: esta casca não sabe nada
 * sobre cartas ou desenhos, só sobre sessão. É o que permite plugar jogo novo
 * sem reescrever convite, placar e fim de partida.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogOut, Check, X, WifiOff } from "lucide-react";
import type { SessionDTO } from "@/nucleo/jogos/tipos";
import { Avatar } from "../Avatar";
import { SeloTinta, Etiqueta, Floreio } from "../Papelaria";
import { cn } from "@/nucleo/utilitarios";

export function JogoSessao({
  sessao,
  ocupado,
  onAceitar,
  onRecusar,
  onSair,
  onJogarDeNovo,
  children,
}: {
  sessao: SessionDTO;
  ocupado?: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
  onSair: () => void;
  onJogarDeNovo?: () => void;
  /** O tabuleiro do jogo. Só é montado quando a partida está ativa. */
  children?: React.ReactNode;
}) {
  const { status, me, partner, myScore, partnerScore, isMyTurn, isHost } = sessao;
  const acabou = status === "finished" || status === "abandoned";

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* ── Cabeçalho: o jogo e o estado ───────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Etiqueta tone="accent">{sessao.gameLabel}</Etiqueta>
          <p className="kicker-sm mt-1.5 truncate">
            {status === "pending"
              ? isHost
                ? `Esperando ${partner.name} aceitar`
                : `${partner.name} te chamou para jogar`
              : status === "active"
                ? isMyTurn
                  ? "É a sua vez"
                  : `Vez de ${partner.name}`
                : "Partida encerrada"}
          </p>
        </div>

        {status === "active" ? (
          <button
            onClick={onSair}
            disabled={ocupado}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border2 px-3 py-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-60"
          >
            <LogOut size={14} /> Sair
          </button>
        ) : null}
      </div>

      {/* ── Placar: os dois, sempre, dentro da sessão ──────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <Jogador
          nome={me.name}
          cor={me.avatarColor}
          foto={me.avatarUrl}
          pontos={myScore}
          daVez={status === "active" && isMyTurn}
          voce
        />
        <Jogador
          nome={partner.name}
          cor={partner.avatarColor}
          foto={partner.avatarUrl}
          pontos={partnerScore}
          daVez={status === "active" && !isMyTurn}
          offline={status === "active" && !sessao.partnerOnline}
        />
      </div>

      {/* ── Corpo ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <Painel key="pending">
            {isHost ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <Loader2 size={22} className="animate-spin text-accent" />
                <p className="text-[14.5px] leading-relaxed text-muted">
                  Mandamos o convite para <strong className="text-text">{partner.name}</strong>.
                  <br />
                  A partida começa assim que aceitar.
                </p>
                <button
                  onClick={onSair}
                  disabled={ocupado}
                  className="mt-1 rounded-lg border border-border2 px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-60"
                >
                  Cancelar convite
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <SeloTinta size={58} seed={sessao.id} />
                <p className="text-[15px] leading-relaxed text-muted">
                  <strong className="text-text">{partner.name}</strong> quer jogar{" "}
                  <strong className="text-text">{sessao.gameLabel}</strong> com você.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onAceitar}
                    disabled={ocupado}
                    className="sheen inline-flex items-center gap-1.5 rounded-lg bg-text px-4 py-2.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    <Check size={15} /> Aceitar e jogar
                  </button>
                  <button
                    onClick={onRecusar}
                    disabled={ocupado}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border2 px-4 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-60"
                  >
                    <X size={15} /> Agora não
                  </button>
                </div>
              </div>
            )}
          </Painel>
        ) : acabou ? (
          <Painel key="fim">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="font-display text-[26px] leading-tight tracking-[-0.02em] text-text">
                {myScore === partnerScore
                  ? "Empate"
                  : myScore > partnerScore
                    ? "Você levou essa"
                    : `${partner.name} levou essa`}
              </p>
              <Floreio width={130} />
              <p className="text-[13.5px] text-muted">{motivoDoFim(sessao)}</p>
              {onJogarDeNovo ? (
                <button
                  onClick={onJogarDeNovo}
                  disabled={ocupado}
                  className="sheen mt-1 rounded-lg bg-text px-4 py-2.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
                >
                  Jogar de novo
                </button>
              ) : null}
            </div>
          </Painel>
        ) : (
          <motion.div
            key="ativo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            {!sessao.partnerOnline ? (
              <p className="mb-2.5 flex items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning/[0.07] px-3 py-2 text-[12.5px] font-medium text-warning">
                <WifiOff size={14} /> {partner.name} está offline. A partida foi pausada.
              </p>
            ) : null}
            <div className="relative">
              {children}
              {!sessao.partnerOnline ? (
                <div className="absolute inset-0 z-20 flex min-h-48 items-center justify-center rounded-2xl bg-bg/90 p-5 text-center backdrop-blur-sm">
                  <div className="max-w-sm">
                    <WifiOff className="mx-auto text-warning" size={32} />
                    <p className="mt-3 font-display text-2xl text-text">Aguardando alguém voltar</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">O tabuleiro está protegido e continuará exatamente deste ponto quando {partner.name} ficar online.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Explica por que a partida acabou — sair no meio é diferente de terminar. */
function motivoDoFim(s: SessionDTO): string {
  const quem = s.endedById === s.meId ? "Você" : s.partner.name;
  switch (s.endedReason) {
    case "left":
      return `${quem} saiu, então a partida foi encerrada para os dois.`;
    case "declined":
      return "O convite foi recusado.";
    case "stale":
      return `${s.partner.name} ficou sem conexão e a partida encerrou.`;
    case "completed":
      return "Partida completa. Boa!";
    default:
      return "A partida foi encerrada.";
  }
}

function Painel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-3 rounded-2xl border border-border2 bg-surface p-5"
    >
      {children}
    </motion.div>
  );
}

function Jogador({
  nome,
  cor,
  foto,
  pontos,
  daVez,
  voce,
  offline,
}: {
  nome: string;
  cor: string;
  foto: string | null;
  pontos: number;
  daVez?: boolean;
  voce?: boolean;
  offline?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2.5 rounded-2xl border bg-surface px-3 py-2.5 transition-colors",
        // Quem está na vez ganha a borda de tinta — é o sinal mais forte que a
        // interface tem, e não depende de cor (funciona para daltônicos).
        daVez ? "border-text" : "border-border2",
        offline && "opacity-60"
      )}
    >
      {daVez ? (
        <span
          aria-hidden
          className="absolute -left-px top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-accent"
        />
      ) : null}
      <Avatar name={nome} color={cor} url={foto} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-text">{voce ? "Você" : nome}</p>
        <p className="kicker-sm truncate">{daVez ? "jogando" : offline ? "ausente" : "aguardando"}</p>
      </div>
      <span className="display-num shrink-0 text-[26px] text-text">{pontos}</span>
    </div>
  );
}
