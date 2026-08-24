"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { RabiscaIcon, type RabiscaIconName } from "./IconesRabisca";

export function RabiscaLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="inline-flex items-center gap-3 text-sm font-semibold text-muted">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <RabiscaIcon name="brush" size={28} />
        </motion.span>
        Preparando os pincéis
      </span>
    </div>
  );
}

export function RabiscaWelcome({
  busy,
  joinCode,
  setJoinCode,
  error,
  onCreate,
  onJoin,
  onBack,
}: {
  busy: boolean;
  joinCode: string;
  setJoinCode: (value: string) => void;
  error: string | null;
  onCreate: () => void;
  onJoin: () => void;
  onBack: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl pb-12">
      <button
        onClick={onBack}
        className="focus-ring mb-4 inline-flex min-h-12 items-center gap-2 px-1 text-sm font-bold text-muted hover:text-text"
      >
        <RabiscaIcon name="back" /> Voltar aos jogos
      </button>

      <div className="relative isolate min-h-[480px] overflow-hidden rounded-3xl border border-border2 bg-[#efe1c7] shadow-card sm:min-h-[540px]">
        <Image
          src="/games/rabisca-hero.webp"
          alt="Casal desenhando com Cookie e o gato cinza em uma mesa"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1150px"
          className="object-cover object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4e8d2] via-[#f4e8d2]/92 to-transparent sm:w-[72%]" />

        <div className="relative z-10 flex min-h-[480px] max-w-xl flex-col justify-center p-5 sm:min-h-[540px] sm:p-10">
          <div className="mb-4 inline-flex w-fit items-center gap-2 border border-[#17140f]/20 bg-[#fffaf0]/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#6f263c]">
            <RabiscaIcon name="brush" size={17} /> sala multiplayer nativa
          </div>
          <h1 className="font-display text-5xl leading-[0.9] tracking-[-0.045em] text-[#17140f] sm:text-7xl">Rabisca!</h1>
          <p className="mt-4 max-w-md text-[15px] font-medium leading-relaxed text-[#4e4438] sm:text-lg">
            Desenhe, arrisque palpites e suba no ranking. Crie uma sala para até 12 pessoas ou entre com o código de um amigo.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_1.15fr]">
            <button
              onClick={onCreate}
              disabled={busy}
              className="focus-ring sheen inline-flex min-h-14 items-center justify-center gap-2 bg-[#17140f] px-5 text-sm font-black text-[#fffaf0] transition hover:bg-[#8f2c49] disabled:opacity-60"
            >
              <RabiscaIcon name="people" /> Criar sala
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onJoin();
              }}
              className="flex min-w-0 border-2 border-[#17140f] bg-[#fffaf0] p-1"
            >
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase().slice(0, 6))}
                placeholder="CÓDIGO"
                aria-label="Código da sala"
                className="min-w-0 flex-1 bg-transparent px-3 text-center text-base font-black uppercase tracking-[0.2em] text-[#17140f] outline-none placeholder:text-[#83786a]"
              />
              <button
                type="submit"
                disabled={busy || joinCode.length < 4}
                className="focus-ring min-h-12 min-w-12 bg-[#c0395c] text-white transition hover:bg-[#17140f] disabled:opacity-40"
                aria-label="Entrar na sala"
              >
                <span className="flex justify-center"><RabiscaIcon name="play" /></span>
              </button>
            </form>
          </div>

          {error ? <p className="mt-3 border-l-4 border-[#b02d3a] pl-3 text-sm font-bold text-[#8f2430]">{error}</p> : null}

          <div className="mt-7 grid grid-cols-3 gap-2 text-[#17140f]">
            <Feature icon="timer" title="Rodadas" detail="com tempo" />
            <Feature icon="people" title="Até 12" detail="jogadores" />
            <Feature icon="crown" title="Ranking" detail="ao vivo" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, detail }: { icon: RabiscaIconName; title: string; detail: string }) {
  return (
    <div className="border-t-2 border-[#17140f]/20 pt-2">
      <RabiscaIcon name={icon} size={19} />
      <strong className="mt-1 block text-xs">{title}</strong>
      <span className="text-[10px] font-semibold opacity-65">{detail}</span>
    </div>
  );
}
