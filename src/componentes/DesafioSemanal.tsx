"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Check, PenLine } from "lucide-react";

export function WeeklyChallenge({
  challenge,
  done,
}: {
  challenge: { emoji: string; title: string; desc: string };
  done: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 ${done ? "border-success/40" : ""}`}
    >
      <div className="flex items-center gap-3.5">
        <motion.span
          animate={done ? {} : { rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-2xl"
        >
          {challenge.emoji}
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <Trophy size={12} /> Desafio da semana
          </div>
          <div className={`font-semibold text-text ${done ? "line-through opacity-70" : ""}`}>
            {challenge.title}
          </div>
          <div className="text-sm text-muted">{challenge.desc}</div>
        </div>
        {done ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-3 py-1.5 text-sm font-semibold text-success">
            <Check size={15} /> Feito
          </span>
        ) : (
          <Link
            href={`/app/novo?desafio=${encodeURIComponent(challenge.title)}`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl accent-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            <PenLine size={15} /> Aceitar
          </Link>
        )}
      </div>
    </motion.div>
  );
}
