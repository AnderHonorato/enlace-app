"use client";
import { useState } from "react";
import { Mail, Sparkles, Target } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { QuadroCapsulas } from "./planos/Capsulas";
import { QuadroDesejos } from "./planos/Desejos";
import { QuadroMetas } from "./planos/Metas";
import type { Capsula, Desejo, Meta } from "./planos/tipos";

const ABAS = [
  { key: "metas", label: "Metas", icon: Target },
  { key: "desejos", label: "Desejos", icon: Sparkles },
  { key: "capsulas", label: "Cápsulas", icon: Mail },
] as const;

export function Planos({
  initialGoals,
  initialWishes,
  initialCapsules,
}: {
  initialGoals: Meta[];
  initialWishes: Desejo[];
  initialCapsules: Capsula[];
}) {
  const [aba, definirAba] = useState<(typeof ABAS)[number]["key"]>("metas");

  return (
    <div>
      <div className="mb-4">
        <div className="kicker mb-1">O futuro de vocês</div>
        <h1 className="font-display text-4xl text-text">Planos</h1>
        <p className="mt-1 text-muted">Metas, desejos e cartas para o futuro — tudo de vocês dois.</p>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {ABAS.map((item) => (
          <button
            key={item.key}
            onClick={() => definirAba(item.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition",
              aba === item.key ? "border-accent bg-accent/8 text-accent" : "border-border text-muted hover:bg-surface2",
            )}
          >
            <item.icon size={16} /> {item.label}
          </button>
        ))}
      </div>
      {aba === "metas" && <QuadroMetas initial={initialGoals} />}
      {aba === "desejos" && <QuadroDesejos initial={initialWishes} />}
      {aba === "capsulas" && <QuadroCapsulas initial={initialCapsules} />}
    </div>
  );
}
