"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarHeart, Gift, Sparkles, Settings } from "lucide-react";
import type { Me } from "@/nucleo/usuario-atual";

type Upcoming = {
  key: string;
  emoji: string;
  label: string;
  days: number;
  detail: string;
};

/** Dias até a próxima ocorrência anual de uma data. */
function daysUntilAnnual(iso: string): { days: number; years: number } {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);
  return { days, years: next.getFullYear() - d.getFullYear() };
}

export function UpcomingDates({ me }: { me: Me }) {
  const items: Upcoming[] = [];

  if (me.couple?.anniversary) {
    const { days, years } = daysUntilAnnual(me.couple.anniversary);
    items.push({
      key: "aniv",
      emoji: "💞",
      label: "Aniversário de namoro",
      days,
      detail: `${years} ${years === 1 ? "ano" : "anos"} juntos`,
    });
  }
  if (me.couple?.metDate) {
    const { days, years } = daysUntilAnnual(me.couple.metDate);
    items.push({
      key: "conhecemos",
      emoji: "👀",
      label: "Dia em que se conheceram",
      days,
      detail: `${years} ${years === 1 ? "ano" : "anos"} dessa história`,
    });
  }
  if (me.partner?.birthday) {
    const { days, years } = daysUntilAnnual(me.partner.birthday);
    items.push({
      key: "niver-partner",
      emoji: "🎂",
      label: `Aniversário de ${me.partner.displayName || me.partner.name}`,
      days,
      detail: `fazendo ${years} anos`,
    });
  }
  if (me.birthday) {
    const { days, years } = daysUntilAnnual(me.birthday);
    items.push({ key: "niver-me", emoji: "🎁", label: "Seu aniversário", days, detail: `fazendo ${years} anos` });
  }

  if (items.length === 0) {
    return (
      <Link
        href="/app/config"
        className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-card"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <CalendarHeart size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text">Datas de vocês</div>
          <div className="text-sm text-muted">Cadastre o início do namoro e os aniversários.</div>
        </div>
        <Settings size={16} className="shrink-0 text-faint" />
      </Link>
    );
  }

  items.sort((a, b) => a.days - b.days);
  const next = items[0];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <CalendarHeart size={18} />
        </span>
        <h2 className="flex-1 font-display text-2xl text-text">Datas especiais</h2>
        <Link href="/app/config" className="text-faint transition hover:text-accent" title="Editar datas">
          <Settings size={16} />
        </Link>
      </div>

      {/* Próxima data em destaque */}
      <div className="rounded-2xl bg-accent/8 p-4 text-center">
        <div className="text-4xl">{next.emoji}</div>
        <div className="mt-1 font-display text-2xl text-text">{next.label}</div>
        <div className="mt-1 text-sm text-muted">{next.detail}</div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white">
          {next.days === 0 ? (
            <>
              <Sparkles size={14} /> É hoje!
            </>
          ) : next.days === 1 ? (
            "É amanhã!"
          ) : (
            `faltam ${next.days} dias`
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-3 space-y-1.5">
          {items.slice(1).map((it) => (
            <div key={it.key} className="flex items-center gap-2.5 text-sm">
              <span className="text-lg">{it.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-muted">{it.label}</span>
              <span className="shrink-0 rounded-full bg-surface2 px-2.5 py-1 text-xs font-medium text-faint">
                {it.days === 0 ? "hoje 🎉" : it.days === 1 ? "amanhã" : `${it.days} dias`}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
