"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { IconCoracao } from "./Icones";

function breakdown(from: Date, now: Date) {
  let years = now.getFullYear() - from.getFullYear();
  let months = now.getMonth() - from.getMonth();
  let days = now.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Contador ao vivo da história do casal, desde quando se conheceram. */
export function TogetherWidget({ startDate }: { startDate: string }) {
  const from = new Date(startDate);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    // evita flash/hydration mismatch — só renderiza no cliente
    return <div className="mb-5 h-[132px] border-b border-border" />;
  }

  // Diferença de dias do calendário: a hora em que a data foi salva não pode
  // fazer o contador perder um dia ao abrir o app em outro fuso ou horário.
  const totalDays = Math.max(0, differenceInCalendarDays(now, from));
  const { years, months, days } = breakdown(from, now);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const parts: string[] = [];
  if (years) parts.push(plural(years, "ano", "anos"));
  if (months) parts.push(plural(months, "mês", "meses"));
  parts.push(plural(days, "dia", "dias"));

  return (
    /* O contador é o herói da tela inicial e funciona como a manchete da
       página. A composição usa papel, régua e um número grande em Fraunces; o acento
       aparece só como marca (o coração e o ponto), nunca como fundo. */
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-5 border-b border-border pb-5"
    >
      <div className="kicker flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.22, 0.96, 1.1, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.22, 0.42, 0.68, 1] }}
          className="inline-flex text-accent"
        >
          <Heart size={12} className="fill-current" />
        </motion.span>
        Juntos há
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="display-num text-[clamp(44px,13vw,68px)] text-text">
          {totalDays.toLocaleString("pt-BR")}
        </span>
        <span className="font-display text-[22px] italic text-muted">dias de história</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted">
        <span>{parts.join(", ")}</span>
        <span aria-hidden className="h-3 w-px bg-border2" />
        <span className="tabular-nums">
          {hh}:{mm}:{ss}
        </span>
        <span className="inline-flex items-center gap-1 text-faint">
          e contando <IconCoracao size={11} />
        </span>
      </div>
    </motion.div>
  );
}
