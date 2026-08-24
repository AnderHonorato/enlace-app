"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, PenLine, Sparkles } from "lucide-react";

export function EstadoVazio({ casalConectado }: { casalConectado: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/12 text-accent">
        <Heart size={30} />
      </div>
      <h2 className="display text-3xl text-text">Sua história começa aqui</h2>
      <p className="mt-2 max-w-xs text-muted">
        Escreva o primeiro momento de vocês — um café, uma risada, uma saudade. Tudo vira memória.
      </p>
      <Link
        href="/app/novo"
        className="sheen mt-6 inline-flex items-center gap-2 rounded-lg bg-text px-6 py-3 font-semibold text-bg shadow-lift transition hover:bg-accent"
      >
        <PenLine size={17} /> Escrever agora
      </Link>
      {!casalConectado && (
        <Link href="/app/config" className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent">
          <Sparkles size={14} /> ou conecte-se com seu amor
        </Link>
      )}
    </motion.div>
  );
}
