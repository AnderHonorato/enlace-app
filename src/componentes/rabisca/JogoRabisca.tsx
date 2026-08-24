"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/nucleo/utilitarios";
import type { RabiscaRoomDTO } from "@/nucleo/rabisca/tipos";
import { RabiscaCanvas } from "./TelaDesenhoRabisca";
import { RabiscaIcon, type RabiscaIconName } from "./IconesRabisca";
import { RabiscaAvatar } from "./AvatarRabisca";

export function RabiscaGame({
  room,
  busy,
  error,
  near,
  reduceMotion,
  onAction,
}: {
  room: RabiscaRoomDTO;
  busy: boolean;
  error: string | null;
  near: boolean;
  reduceMotion: boolean;
  onAction: (move: Record<string, unknown>, quiet?: boolean) => Promise<any>;
}) {
  const [localSeconds, setLocalSeconds] = useState(room.secondsLeft);

  useEffect(() => setLocalSeconds(room.secondsLeft), [room.secondsLeft, room.round, room.status]);
  useEffect(() => {
    if (room.status !== "active") return;
    const timer = window.setInterval(() => setLocalSeconds((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [room.status, room.round]);

  const drawer = room.players.find((player) => player.userId === room.drawerId);
  return (
    <main className="relative min-h-0 flex-1 overflow-y-auto landscape:overflow-hidden md:overflow-hidden">
      <div className="mx-auto grid min-h-full w-full max-w-[1500px] gap-2 p-2 landscape:grid-cols-[118px_minmax(220px,1fr)_190px] landscape:grid-rows-1 md:grid-cols-[180px_minmax(0,1fr)_260px] md:grid-rows-1">
        <Ranking room={room} />

        <section className="order-2 flex min-h-0 flex-col border border-border2 bg-surface shadow-card landscape:order-none md:order-none">
          <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border2 bg-bg2 px-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-faint">{room.isDrawer ? "Sua palavra" : `${drawer?.name || "Alguém"} desenha`}</p>
              <p className="truncate font-display text-lg tracking-[0.12em]">{room.isDrawer ? room.word : room.wordMask || "Adivinhe pelo desenho"}</p>
            </div>
            <div className={cn("display-num inline-flex min-w-[58px] items-center justify-center gap-1.5 border px-2 py-1 text-xl", localSeconds <= 15 ? "border-danger bg-danger/10 text-danger" : "border-border2 bg-surface text-text")}>
              <RabiscaIcon name="timer" size={17} />{localSeconds}
            </div>
          </div>
          <RabiscaCanvas room={room} onAction={onAction} />
        </section>

        <GuessPanel room={room} busy={busy} error={error} onAction={onAction} />
      </div>

      <AnimatePresence>
        {near ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.72, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none fixed left-1/2 top-[42%] z-[95] -translate-x-1/2 border-2 border-warning bg-[#fff7df] px-6 py-4 text-center text-[#6d4612] shadow-card"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">palpite</span>
            <p className="font-display text-3xl">Você está perto!</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {room.status === "paused" ? (
        <StatusOverlay
          icon="offline"
          title="Partida pausada"
          detail="Não há participantes suficientes online. O desenho e o relógio voltam quando alguém entrar novamente."
        />
      ) : null}
      {room.status === "roundEnd" && room.result ? <RoundResult room={room} busy={busy} reduceMotion={reduceMotion} onAction={onAction} /> : null}
      {room.status === "finished" ? <FinalResult room={room} /> : null}
    </main>
  );
}

function Ranking({ room }: { room: RabiscaRoomDTO }) {
  return (
    <aside className="order-1 min-w-0 border border-border2 bg-surface p-2 landscape:order-none landscape:overflow-y-auto md:order-none md:overflow-y-auto">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-faint">Ranking atual</span>
        <RabiscaIcon name="crown" size={18} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 landscape:flex-col landscape:overflow-visible md:flex-col md:overflow-visible">
        {room.players.map((player, index) => (
          <div
            key={player.id}
            className={cn(
              "flex min-w-[150px] items-center gap-2 border px-2 py-2 landscape:min-w-0 md:min-w-0",
              player.isMe ? "border-accent bg-accent/[0.06]" : "border-border2 bg-bg",
              !player.online && "opacity-50"
            )}
          >
            <span className="display-num w-4 text-center text-sm">{index + 1}</span>
            <div className="relative">
              <RabiscaAvatar name={player.name} color={player.avatarColor} url={player.avatarUrl} size={34} />
              {!player.online ? <span className="absolute -bottom-1 -right-1 bg-bg p-0.5 text-danger"><RabiscaIcon name="offline" size={13} /></span> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black">{player.isMe ? "Você" : player.name}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">{player.isDrawer ? "desenhando" : player.online ? "online" : "offline"}</p>
            </div>
            <strong className="display-num text-xl">{player.score}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function GuessPanel({
  room,
  busy,
  error,
  onAction,
}: {
  room: RabiscaRoomDTO;
  busy: boolean;
  error: string | null;
  onAction: (move: Record<string, unknown>) => Promise<any>;
}) {
  const [text, setText] = useState("");
  return (
    <aside className="order-3 flex min-h-[260px] flex-col border border-border2 bg-surface landscape:order-none landscape:min-h-0 md:order-none md:min-h-0">
      <div className="border-b border-border2 bg-bg2 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-faint">Palpites da sala</p>
        <p className="text-xs font-semibold text-muted">A resposta certa só aparece no fim.</p>
      </div>
      <div className="min-h-[120px] flex-1 space-y-1.5 overflow-y-auto p-2">
        {room.guesses.length ? room.guesses.map((guess) => (
          <motion.div
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            key={guess.id}
            className={cn("border px-2.5 py-2 text-xs", guess.correct ? "border-success bg-success/10 text-success" : "border-border2 bg-bg text-muted")}
          >
            <strong className="mr-1 text-text">{guess.userId === room.meId ? "Você" : guess.name}:</strong>
            {guess.correct ? "acertou a palavra" : guess.text}
          </motion.div>
        )) : (
          <div className="flex h-full min-h-[120px] items-center justify-center text-center text-xs font-semibold text-faint">Os palpites aparecem aqui.</div>
        )}
      </div>

      {!room.isDrawer && room.status === "active" ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const guess = text.trim();
            if (!guess) return;
            setText("");
            await onAction({ type: "guess", text: guess }).catch(() => setText(guess));
          }}
          className="flex gap-1.5 border-t border-border2 bg-bg2 p-2"
        >
          <input value={text} onChange={(event) => setText(event.target.value)} maxLength={60} autoComplete="off" placeholder="Digite seu palpite" className="h-12 min-w-0 flex-1 border border-border2 bg-surface px-3 text-sm font-semibold outline-none focus:border-text" />
          <button type="submit" disabled={busy || !text.trim()} className="focus-ring inline-flex h-12 w-12 items-center justify-center bg-text text-bg transition hover:bg-accent disabled:opacity-40" aria-label="Enviar palpite"><RabiscaIcon name="send" /></button>
        </form>
      ) : (
        <div className="border-t border-border2 bg-bg2 p-3 text-center text-xs font-bold text-muted">{room.isDrawer ? "Você está desenhando nesta rodada." : "A rodada está em intervalo."}</div>
      )}
      {error ? <p className="border-t border-danger/30 bg-danger/10 px-3 py-2 text-[11px] font-bold text-danger">{error}</p> : null}
    </aside>
  );
}

function StatusOverlay({ icon, title, detail }: { icon: RabiscaIconName; title: string; detail: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/90 p-5 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md border-2 border-text bg-surface p-7 text-center shadow-card">
        <span className="mx-auto flex h-16 w-16 items-center justify-center bg-warning/15 text-warning"><RabiscaIcon name={icon} size={34} /></span>
        <h2 className="mt-4 font-display text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{detail}</p>
        <motion.span className="mt-5 inline-block h-1 w-24 bg-accent" animate={{ scaleX: [0.35, 1, 0.35] }} transition={{ duration: 1.8, repeat: Infinity }} />
      </motion.div>
    </div>
  );
}

function RoundResult({
  room,
  busy,
  reduceMotion,
  onAction,
}: {
  room: RabiscaRoomDTO;
  busy: boolean;
  reduceMotion: boolean;
  onAction: (move: Record<string, unknown>) => Promise<any>;
}) {
  const result = room.result!;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#17140f]/78 p-4 backdrop-blur-[2px]">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.72, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 22 }}
        className="relative w-full max-w-lg overflow-hidden border-4 border-[#17140f] bg-[#fff8e9] p-6 text-center text-[#17140f] shadow-2xl sm:p-9"
      >
        <div className="absolute -left-8 top-6 h-5 w-28 -rotate-12 bg-[#c0395c]" />
        <div className="absolute -right-7 bottom-8 h-4 w-24 rotate-12 bg-[#b8862f]" />
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#746757]">fim da rodada {room.round}</span>
        <h2 className="mt-3 font-display text-4xl leading-[0.95] sm:text-5xl">{result.winnerName ? `${result.winnerName} acertou!` : "O tempo acabou"}</h2>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-[#746757]">palavra</p>
        <p className="mt-1 font-display text-4xl text-[#9d2e4c]">{result.word}</p>
        {room.isHost ? (
          <button onClick={() => onAction({ type: "next" })} disabled={busy} className="focus-ring sheen mt-7 inline-flex min-h-13 items-center justify-center gap-2 bg-[#17140f] px-6 py-3 text-sm font-black text-[#fff8e9] disabled:opacity-50">
            <RabiscaIcon name={room.round >= room.totalRounds ? "crown" : "play"} />
            {room.round >= room.totalRounds ? "Ver resultado final" : "Próxima rodada"}
          </button>
        ) : <p className="mt-7 text-xs font-bold text-[#746757]">Aguardando o anfitrião continuar.</p>}
      </motion.div>
    </div>
  );
}

function FinalResult({ room }: { room: RabiscaRoomDTO }) {
  const winner = room.players[0];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg p-4">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl border-2 border-text bg-surface p-6 text-center shadow-card">
        <span className="mx-auto flex h-16 w-16 items-center justify-center bg-warning/15 text-warning"><RabiscaIcon name="crown" size={36} /></span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-faint">ranking final</p>
        <h2 className="mt-2 font-display text-4xl">{winner ? `${winner.name} venceu` : "Partida encerrada"}</h2>
        <div className="mx-auto mt-6 max-w-sm space-y-2">
          {room.players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-3 border border-border2 bg-bg px-3 py-2 text-left">
              <strong className="display-num w-6 text-xl">{index + 1}</strong>
              <RabiscaAvatar name={player.name} color={player.avatarColor} url={player.avatarUrl} size={38} />
              <span className="min-w-0 flex-1 truncate text-sm font-black">{player.name}</span>
              <strong className="display-num text-2xl">{player.score}</strong>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 bg-text px-6 text-sm font-black text-bg"><RabiscaIcon name="home" />Voltar ao início</button>
      </motion.div>
    </div>
  );
}
