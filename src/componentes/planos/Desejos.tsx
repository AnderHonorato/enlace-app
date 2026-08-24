"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Target,
  Sparkles,
  Mail,
  Plus,
  Trash2,
  Check,
  Loader2,
  Lock,
  X,
  Clock,
  Package,
} from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "../Avisos";
import { confirmDialog } from "../DialogoConfirmacao";
import { fmtDate, cn } from "@/nucleo/utilitarios";
import { IconCerto, IconBrilho } from "../Icones";


import type { Capsula, Desejo, Meta } from "./tipos";

const TIPOS_DESEJO: Record<string, { label: string; emoji: string }> = {
  date: { label: "Encontro", emoji: "💑" },
  lugar: { label: "Lugar", emoji: "📍" },
  sonho: { label: "Sonho", emoji: "✨" },
  outro: { label: "Outro", emoji: "💡" },
};

export function QuadroDesejos({ initial }: { initial: Desejo[] }) {
  const [wishes, setDesejoes] = useState(initial);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("date");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ wish: Desejo }>("/api/wishes", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), kind }),
      });
      setDesejoes((w) => [res.wish, ...w]);
      setTitle("");
      toast("Desejo adicionado · +3 pts ✨", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(w: Desejo) {
    setDesejoes((arr) => arr.map((x) => (x.id === w.id ? { ...x, done: !x.done } : x)));
    try {
      await api(`/api/wishes/${w.id}`, { method: "PATCH", body: JSON.stringify({ done: !w.done }) });
      if (!w.done) toast("Realizado! 🥂", "success");
    } catch {
      setDesejoes((arr) => arr.map((x) => (x.id === w.id ? { ...x, done: w.done } : x)));
    }
  }

  async function remove(id: string) {
    setDesejoes((arr) => arr.filter((x) => x.id !== id));
    await api(`/api/wishes/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <form onSubmit={create} className="card p-3.5">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que vocês querem viver? (ex: Piquenique no pôr do sol)"
            className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="flex items-center gap-1.5 rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(TIPOS_DESEJO).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                kind === k ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:bg-surface2"
              )}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </form>

      {wishes.length === 0 && (
        <p className="flex items-center justify-center gap-1.5 py-8 text-center text-sm text-faint">
          A lista está vazia. Sonhem alto!
          <span className="text-accent">
            <IconBrilho size={14} />
          </span>
        </p>
      )}

      <AnimatePresence>
        {wishes.map((w) => {
          const k = TIPOS_DESEJO[w.kind] ?? TIPOS_DESEJO.outro;
          return (
            <motion.div
              key={w.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="group card flex items-center gap-3 p-3.5"
            >
              <button
                onClick={() => toggle(w)}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                  w.done ? "border-transparent accent-gradient text-white" : "border-border2 hover:border-accent"
                )}
              >
                {w.done && <Check size={14} />}
              </button>
              <span className={cn("min-w-0 flex-1 text-[15px] text-text", w.done && "line-through text-faint")}>
                {w.title}
              </span>
              <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-muted">
                {k.emoji} {k.label}
              </span>
              <button onClick={() => remove(w.id)} className="shrink-0 text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger">
                <Trash2 size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── Cápsulas do tempo ─────────────── */
