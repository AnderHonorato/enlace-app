"use client";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  MessageCircle,
  ImageIcon,
  Paperclip,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { confirmDialog } from "./DialogoConfirmacao";
import { cn, relTime } from "@/nucleo/utilitarios";


import type { Lista } from "./tarefas/tipos";
import { CartaoLista } from "./tarefas/CartaoLista";

export function Tarefas({ initial }: { initial: Lista[] }) {
  const [listas, setListas] = useState(initial);
  const [novaLista, setNovaLista] = useState("");
  const [busy, setBusy] = useState(false);

  async function criarLista(e: React.FormEvent) {
    e.preventDefault();
    if (!novaLista.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ lista: Lista }>("/api/tarefas", {
        method: "POST",
        body: JSON.stringify({ title: novaLista.trim() }),
      });
      setListas((l) => [...l, res.lista]);
      setNovaLista("");
      toast("Lista criada!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function deletarLista(id: string) {
    const ok = await confirmDialog({ title: "Apagar lista?", message: "As tarefas dentro dela também serão apagadas.", danger: true, confirmLabel: "Apagar" });
    if (!ok) return;
    setListas((l) => l.filter((x) => x.id !== id));
    await api(`/api/listas/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div>
      <div className="mb-4">
        <div className="kicker mb-1">Organização a dois</div>
        <h1 className="font-display text-4xl text-text">Tarefas</h1>
        <p className="mt-1 text-muted">Listas compartilhadas com tarefas, fotos, arquivos e comentários.</p>
      </div>

      <form onSubmit={criarLista} className="mb-5 card p-3.5">
        <div className="flex gap-2">
          <input
            value={novaLista}
            onChange={(e) => setNovaLista(e.target.value)}
            placeholder="Nova lista… (ex: Compras, Viagem, Casa)"
            className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={busy || !novaLista.trim()}
            className="flex items-center gap-1.5 rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar
          </button>
        </div>
      </form>

      {listas.length === 0 && (
        <p className="py-10 text-center text-sm text-faint">
          Nenhuma lista ainda. Criem uma lista e organizem a vida juntos.
        </p>
      )}

      <div className="space-y-6">
        <AnimatePresence>
          {listas.map((lista) => (
            <CartaoLista key={lista.id} lista={lista} onDelete={deletarLista} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
