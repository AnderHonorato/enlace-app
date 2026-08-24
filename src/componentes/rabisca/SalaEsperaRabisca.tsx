"use client";

import { motion } from "framer-motion";
import { cn } from "@/nucleo/utilitarios";
import type { RabiscaMode, RabiscaRoomDTO, RabiscaTheme } from "@/nucleo/rabisca/tipos";
import { RabiscaIcon, type RabiscaIconName } from "./IconesRabisca";
import { RabiscaAvatar } from "./AvatarRabisca";

const MODES: { id: RabiscaMode; title: string; detail: string; icon: RabiscaIconName }[] = [
  { id: "classico", title: "Clássico", detail: "Todas as ferramentas", icon: "brush" },
  { id: "rapido", title: "Rápido", detail: "45 segundos", icon: "timer" },
  { id: "sem_borracha", title: "Traço firme", detail: "Sem apagar", icon: "ink" },
];

const THEMES: { id: RabiscaTheme; title: string; icon: RabiscaIconName }[] = [
  { id: "cotidiano", title: "Cotidiano", icon: "home" },
  { id: "viagem", title: "Viagem", icon: "map" },
  { id: "comida", title: "Comida", icon: "plate" },
  { id: "brasil", title: "Brasil", icon: "leaf" },
];

export function RabiscaTopbar({
  room,
  landscape,
  onBack,
  onRotate,
}: {
  room: RabiscaRoomDTO;
  landscape: boolean;
  onBack: () => void;
  onRotate: () => void;
}) {
  const roundLabel = room.round ? `${room.round}/${room.totalRounds}` : "sala";
  return (
    <header className="flex min-h-[58px] shrink-0 items-center gap-2 border-b border-border2 bg-bg2 px-2 pb-0 pt-[env(safe-area-inset-top)] sm:px-4">
      <button
        onClick={onBack}
        className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-border2 bg-surface text-muted hover:text-text"
        aria-label="Sair da sala"
      >
        <RabiscaIcon name="back" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-none">{room.title}</p>
        <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-faint">{roundLabel} · código {room.code}</p>
      </div>
      <div className="hidden items-center gap-1.5 border border-border2 bg-surface px-2.5 py-1.5 text-xs font-black sm:flex">
        <RabiscaIcon name="people" size={16} />
        {room.players.filter((player) => player.online).length}/{room.players.length}
      </div>
      <button
        onClick={onRotate}
        className="focus-ring inline-flex min-h-11 items-center gap-2 border border-border2 bg-surface px-3 text-xs font-black text-muted hover:text-text"
        aria-label="Jogar com tela deitada"
      >
        <RabiscaIcon name={landscape ? "expand" : "rotate"} size={19} />
        <span className="hidden sm:inline">Tela deitada</span>
      </button>
    </header>
  );
}

export function RabiscaLobby({
  room,
  busy,
  error,
  onAction,
}: {
  room: RabiscaRoomDTO;
  busy: boolean;
  error: string | null;
  onAction: (move: Record<string, unknown>) => Promise<unknown>;
}) {
  const inviteUrl = typeof window === "undefined" ? "" : `${window.location.origin}/app/jogos/rabisca?sala=${room.code}`;
  const online = room.players.filter((player) => player.online).length;
  const updateSettings = (patch: Record<string, unknown>) => onAction({
    type: "settings",
    title: room.title,
    mode: room.mode,
    theme: room.theme,
    totalRounds: room.totalRounds,
    roundSeconds: room.roundSeconds,
    ...patch,
  });

  async function copyInvite() {
    await navigator.clipboard.writeText(`Entre na minha sala do Rabisca: ${inviteUrl}`).catch(() => {});
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)]">
        <section className="border border-border2 bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="kicker">Jogadores</span>
              <h2 className="mt-1 font-display text-2xl">{online} online</h2>
            </div>
            <span className="inline-flex h-12 w-12 items-center justify-center bg-accent text-white"><RabiscaIcon name="people" /></span>
          </div>

          <div className="mt-4 space-y-2">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex min-h-14 items-center gap-3 border px-3 py-2",
                  player.online ? "border-border2 bg-surface2" : "border-border bg-bg opacity-55"
                )}
              >
                <span className="display-num w-5 text-center text-lg text-faint">{index + 1}</span>
                <RabiscaAvatar name={player.name} color={player.avatarColor} url={player.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{player.name}{player.isMe ? " · você" : ""}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{player.online ? "online" : "offline"}</p>
                </div>
                {player.isHost ? <span className="text-warning" title="Anfitrião"><RabiscaIcon name="crown" size={19} /></span> : null}
              </div>
            ))}
          </div>

          <button
            onClick={copyInvite}
            className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 border-2 border-text bg-bg px-4 text-sm font-black transition hover:bg-text hover:text-bg"
          >
            <RabiscaIcon name="copy" /> Copiar convite · {room.code}
          </button>
        </section>

        <section className="border border-border2 bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2"><RabiscaIcon name="settings" /><h2 className="font-display text-2xl">Preparar partida</h2></div>
          {room.isHost ? (
            <div className="mt-5 space-y-5">
              <ChoiceGroup title="Modo">
                {MODES.map((mode) => (
                  <Choice key={mode.id} active={room.mode === mode.id} icon={mode.icon} title={mode.title} detail={mode.detail} onClick={() => updateSettings({ mode: mode.id })} />
                ))}
              </ChoiceGroup>

              <ChoiceGroup title="Tema">
                {THEMES.map((theme) => (
                  <Choice key={theme.id} active={room.theme === theme.id} icon={theme.icon} title={theme.title} onClick={() => updateSettings({ theme: theme.id })} />
                ))}
              </ChoiceGroup>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                  Rodadas
                  <select value={room.totalRounds} onChange={(event) => updateSettings({ totalRounds: Number(event.target.value) })} className="mt-2 h-12 w-full border border-border2 bg-bg px-3 text-base font-black text-text">
                    <option value={3}>3 rodadas</option><option value={5}>5 rodadas</option><option value={8}>8 rodadas</option>
                  </select>
                </label>
                <label className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                  Tempo
                  <select disabled={room.mode === "rapido"} value={room.roundSeconds} onChange={(event) => updateSettings({ roundSeconds: Number(event.target.value) })} className="mt-2 h-12 w-full border border-border2 bg-bg px-3 text-base font-black text-text disabled:opacity-50">
                    <option value={60}>60 segundos</option><option value={80}>80 segundos</option><option value={90}>90 segundos</option>
                  </select>
                </label>
              </div>

              <button
                onClick={() => onAction({ type: "start" })}
                disabled={busy || online < 2}
                className="focus-ring sheen inline-flex min-h-14 w-full items-center justify-center gap-2 bg-text px-5 text-sm font-black text-bg transition hover:bg-accent disabled:opacity-45"
              >
                <RabiscaIcon name="play" />{online < 2 ? "Aguardando mais alguém" : "Iniciar partida"}
              </button>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center py-8 text-center">
              <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="text-accent">
                <RabiscaIcon name="wait" size={52} />
              </motion.span>
              <h3 className="mt-4 font-display text-2xl">O anfitrião está preparando</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Você já está na sala. Mantenha esta tela aberta para aparecer como online.</p>
            </div>
          )}
          {error ? <p className="mt-3 border-l-4 border-danger pl-3 text-sm font-bold text-danger">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}

function ChoiceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-muted">{title}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div></fieldset>;
}

function Choice({ active, icon, title, detail, onClick }: { active: boolean; icon: RabiscaIconName; title: string; detail?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("focus-ring relative min-h-[78px] border p-3 text-left transition", active ? "border-text bg-text text-bg" : "border-border2 bg-bg text-text hover:border-text")}>
      <RabiscaIcon name={icon} size={22} />
      <strong className="mt-2 block text-xs">{title}</strong>
      {detail ? <span className={cn("text-[10px] font-semibold", active ? "text-bg/65" : "text-faint")}>{detail}</span> : null}
      {active ? <span className="absolute right-2 top-2"><RabiscaIcon name="check" size={15} /></span> : null}
    </button>
  );
}
