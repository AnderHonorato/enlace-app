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


import type { Capsula, Desejo, Etapa, Meta } from "./tipos";

const EMOJIS_METAS = ["🎯", "✈️", "🏠", "💰", "💪", "📚", "🌱", "💍"];

export function QuadroMetas({ initial }: { initial: Meta[] }) {
  const [goals, setMetas] = useState(initial);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ goal: Meta }>("/api/goals", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), emoji }),
      });
      setMetas((g) => [res.goal, ...g]);
      setTitle("");
      toast("Meta criada · +3 pts 🎯", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function update(goal: Meta) {
    setMetas((g) => g.map((x) => (x.id === goal.id ? goal : x)));
  }

  async function remove(id: string) {
    const ok = await confirmDialog({ title: "Apagar meta?", danger: true, confirmLabel: "Apagar" });
    if (!ok) return;
    setMetas((g) => g.filter((x) => x.id !== id));
    await api(`/api/goals/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <form onSubmit={create} className="card p-3.5">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova meta de vocês… (ex: Viajar pra praia)"
            className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="flex items-center gap-1.5 rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          {EMOJIS_METAS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              className={cn("rounded-lg p-1.5 text-lg transition", emoji === em ? "bg-accent/15" : "hover:bg-surface2")}
            >
              {em}
            </button>
          ))}
        </div>
      </form>

      {goals.length === 0 && (
        <p className="py-8 text-center text-sm text-faint">Nenhuma meta ainda. Qual o próximo sonho de vocês?</p>
      )}

      <AnimatePresence>
        {goals.map((g) => (
          <CartaoMeta key={g.id} goal={g} onUpdate={update} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CartaoMeta({
  goal,
  onUpdate,
  onRemove,
}: {
  goal: Meta;
  onUpdate: (g: Meta) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newEtapa, setNewEtapa] = useState("");
  const ratio = goal.total > 0 ? goal.doneCount / goal.total : goal.done ? 1 : 0;

  async function patchEtapas(steps: Etapa[]) {
    try {
      const res = await api<{ goal: Meta }>(`/api/goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ steps }),
      });
      onUpdate(res.goal);
      if (res.goal.done && !goal.done) toast("Meta concluída! 🎉", "success");
    } catch (err: any) {
      toast(err.message, "error");
    }
  }

  function toggleEtapa(i: number) {
    const steps = goal.steps.map((s, j) => (j === i ? { ...s, done: !s.done } : s));
    patchEtapas(steps);
  }

  function addEtapa(e: React.FormEvent) {
    e.preventDefault();
    const text = newEtapa.trim();
    if (!text) return;
    setNewEtapa("");
    patchEtapas([...goal.steps, { text, done: false }]);
  }

  function removeEtapa(i: number) {
    patchEtapas(goal.steps.filter((_, j) => j !== i));
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn("card overflow-hidden", goal.done && "border-success/40")}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="text-2xl">{goal.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={cn("font-semibold text-text", goal.done && "line-through opacity-70")}>
            {goal.title}{" "}
            {goal.done && (
              <span className="inline-block align-[-2px] text-success">
                <IconCerto size={15} />
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
            <motion.div
              className={cn("h-full rounded-full", goal.done ? "bg-success" : "accent-gradient")}
              animate={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-faint">
          {goal.total > 0 ? `${goal.doneCount}/${goal.total}` : "checklist"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="space-y-1.5 p-4">
              {goal.steps.map((s, i) => (
                <div key={i} className="group flex items-center gap-2.5">
                  <button
                    onClick={() => toggleEtapa(i)}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                      s.done ? "border-transparent accent-gradient text-white" : "border-border2 hover:border-accent"
                    )}
                  >
                    {s.done && <Check size={13} />}
                  </button>
                  <span className={cn("flex-1 text-sm text-text", s.done && "line-through text-faint")}>{s.text}</span>
                  <button onClick={() => removeEtapa(i)} className="text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <form onSubmit={addEtapa} className="flex items-center gap-2 pt-1">
                <input
                  value={newEtapa}
                  onChange={(e) => setNewEtapa(e.target.value)}
                  placeholder="Adicionar passo…"
                  className="focus-ring flex-1 rounded-lg border border-border bg-bg2 px-3 py-1.5 text-sm text-text placeholder:text-faint"
                />
                <button type="submit" disabled={!newEtapa.trim()} className="rounded-lg bg-accent/12 p-1.5 text-accent disabled:opacity-40">
                  <Plus size={16} />
                </button>
              </form>
              <button onClick={() => onRemove(goal.id)} className="mt-1 flex items-center gap-1.5 text-xs text-faint transition hover:text-danger">
                <Trash2 size={13} /> Apagar meta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────── Desejos ─────────────── */
