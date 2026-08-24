"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/nucleo/movimento";
import { IconClose, IconPlay } from "../IconesRetrospectiva";
import { RetroBackdrop } from "../CenasRetrospectiva";
import { Polaroide } from "./MoldurasFotos";
import type { DadosRetrospectiva } from "./tipos";

type PropriedadesCapaRetrospectiva = {
  dados: DadosRetrospectiva;
  semestre?: number;
  totalCenas: number;
  movimentoReduzido: boolean;
  aoFechar: () => void;
  aoComecar: () => void;
};

export function CapaRetrospectiva({
  dados,
  semestre,
  totalCenas,
  movimentoReduzido,
  aoFechar,
  aoComecar,
}: PropriedadesCapaRetrospectiva) {
  const periodo = dados.allTime
    ? "Nossa história no Enlace"
    : `${semestre ?? 1}º semestre de ${dados.year}`;
  const fotoCapa = dados.photos?.[0]?.url ?? null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={`Abrir retrospectiva de ${dados.names}`}
      className="retro-editorial fixed inset-0 z-[130] overflow-y-auto bg-[#f6f1e8] px-5 py-[max(1.25rem,env(safe-area-inset-top))] text-[#302c27]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <RetroBackdrop index={0} total={totalCenas} grad={["#a32e4c", "#5b3b8c"]} />
      </div>
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col justify-between py-4 sm:py-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#a32e4c]">Retrospectiva</span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar retrospectiva"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8ccb6] bg-[#f6f1e8]/80 text-[#302c27] backdrop-blur"
          >
            <IconClose size={20} />
          </button>
        </div>

        <motion.section
          initial={movimentoReduzido ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: EASE_OUT }}
          className="my-8"
        >
          {fotoCapa && (
            <div className="mb-7 flex justify-center">
              <Polaroide src={fotoCapa} alt="Uma lembrança do casal" rotate={-3} delay={0.05} size={230} kenBurns={false} />
            </div>
          )}
          <p className="text-sm font-semibold text-[#57503f]">{periodo}</p>
          <h1 className="mt-3 font-display text-[clamp(3.25rem,14vw,6rem)] leading-[0.88] tracking-[-0.05em] text-[#302c27]">
            Nosso<br /><span className="text-[#a32e4c]">Enlace</span>
          </h1>
          <p className="mt-5 max-w-md font-display text-xl italic leading-relaxed text-[#57503f]">
            {dados.names}, chegou a hora de rever tudo o que vocês viveram por aqui.
          </p>
        </motion.section>

        <div>
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-[#57503f]">
            <span className="rounded-full border border-[#d8ccb6] bg-white/45 px-3 py-1.5">{totalCenas} cenas</span>
            {dados.total > 0 && <span className="rounded-full border border-[#d8ccb6] bg-white/45 px-3 py-1.5">{dados.total} memórias</span>}
            {(dados.appStats?.chatMessages ?? 0) > 0 && (
              <span className="rounded-full border border-[#d8ccb6] bg-white/45 px-3 py-1.5">{dados.appStats!.chatMessages} mensagens</span>
            )}
          </div>
          <button
            type="button"
            onClick={aoComecar}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#302c27] px-6 py-4 text-base font-bold text-[#f6f1e8] shadow-xl transition hover:bg-[#a32e4c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a32e4c]"
          >
            <IconPlay size={20} /> Começar retrospectiva
          </button>
          <p className="mt-3 text-center text-xs text-[#57503f]">Toque nas laterais, deslize ou use as setas do teclado.</p>
        </div>
      </div>
    </section>
  );
}
