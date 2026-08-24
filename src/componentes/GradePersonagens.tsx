"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, ChevronRight } from "lucide-react";
import { CharacterAvatar } from "./AvatarPersonagem";
import { CHARACTERS } from "@/nucleo/personagens";

export function CharacterGrid({ hasKey }: { hasKey: boolean }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl text-text">Personagens</h1>
        <p className="mt-1 text-muted">Converse com quem te entende. Cada um tem um jeito próprio.</p>
      </div>

      {!hasKey && (
        <Link
          href="/app/config"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/8 p-4 transition hover:bg-accent/12"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <KeyRound size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-text">Conecte uma IA para conversar</div>
            <div className="text-sm text-muted">Adicione sua chave do GPT, DeepSeek ou Claude nas configurações.</div>
          </div>
          <ChevronRight size={18} className="text-accent" />
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {CHARACTERS.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={`/app/personagens/${c.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <CharacterAvatar slug={c.slug} size={64} className="transition group-hover:scale-105" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-text">{c.name}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${c.accent}22`, color: c.accent }}>
                    {c.role}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{c.tagline}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-faint transition group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
