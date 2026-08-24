"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  PenLine,
  Camera,
  Mic,
  ListChecks,
  MapPin,
  Music,
  CalendarHeart,
  MessageCircle,
  Users,
} from "lucide-react";
import { conviteDoDia, ACOES, type TipoAcao } from "@/nucleo/perguntas";
import { Etiqueta } from "./Papelaria";

/** Um ícone por tipo de ação — é o que faz o card parecer um pedido novo, e
 *  não a mesma pergunta de sempre com outro texto. */
const ICONES: Record<TipoAcao, typeof PenLine> = {
  escrever: PenLine,
  foto: Camera,
  voz: Mic,
  lista: ListChecks,
  lugar: MapPin,
  musica: Music,
  plano: CalendarHeart,
  conversa: MessageCircle,
  juntos: Users,
};

export function DailyQuestion({ chave = "" }: { chave?: string }) {
  const convite = conviteDoDia(new Date(), chave);
  const acao = ACOES[convite.k];
  const Icone = ICONES[convite.k];
  const reduzir = useReducedMotion();

  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5"
    >
      <div className="scrap-frame scrap-frame-botanical relative overflow-hidden rounded-2xl border border-border2 bg-surface">
        {/* Marca d'água: o ícone da ação, grande e quase apagado, dá silhueta
            ao bloco sem custar mais um elemento de interface. */}
        <Icone
          size={132}
          strokeWidth={0.7}
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 text-accent/[0.07]"
        />

        <div className="relative flex items-start gap-3.5 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/[0.08] text-accent">
            <Icone size={19} strokeWidth={1.7} />
          </span>

          <div className="min-w-0 flex-1">
            <Etiqueta tone="accent">{acao.rotulo}</Etiqueta>
            <p className="mt-2 font-display text-[19px] leading-[1.22] tracking-[-0.015em] text-text">
              {convite.t}
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
          <span className="kicker-sm truncate">
            {convite.k === "juntos" ? "Vale mais se os dois responderem" : "Leva um minuto"}
          </span>
          <Link
            href={acao.href(convite.t)}
            className="sheen inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-text px-4 py-2 text-[13px] font-semibold text-bg transition-colors hover:bg-accent"
          >
            <Icone size={14} strokeWidth={2} /> {acao.botao}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
