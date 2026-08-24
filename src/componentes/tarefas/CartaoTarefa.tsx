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
import { toast } from "../Avisos";
import { confirmDialog } from "../DialogoConfirmacao";
import { cn, relTime } from "@/nucleo/utilitarios";


import type { Arquivo, Lista, Tarefa } from "./tipos";

export function CartaoTarefa({
  tarefa,
  onUpdate,
  onDelete,
}: {
  tarefa: Tarefa;
  onUpdate: (t: Tarefa) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(tarefa.content);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const updated = { ...tarefa, done: !tarefa.done };
    onUpdate(updated);
    try {
      const res = await api<{ tarefa: Tarefa }>(`/api/tarefas/${tarefa.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: updated.done }),
      });
      onUpdate(res.tarefa);
    } catch (err: any) {
      toast(err.message, "error");
      onUpdate(tarefa);
    }
  }

  async function salvarEdicao() {
    if (!editText.trim()) return;
    setEditing(false);
    const updated = { ...tarefa, content: editText.trim() };
    onUpdate(updated);
    try {
      const res = await api<{ tarefa: Tarefa }>(`/api/tarefas/${tarefa.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editText.trim() }),
      });
      onUpdate(res.tarefa);
    } catch (err: any) {
      toast(err.message, "error");
      onUpdate(tarefa);
    }
  }

  async function remover() {
    const ok = await confirmDialog({ title: "Apagar tarefa?", danger: true, confirmLabel: "Apagar" });
    if (!ok) return;
    onDelete(tarefa.id);
    await api(`/api/tarefas/${tarefa.id}`, { method: "DELETE" }).catch(() => {});
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ tarefa: Tarefa }>(`/api/tarefas/${tarefa.id}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      onUpdate(res.tarefa);
      setCommentText("");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function removerComentario(cid: string) {
    try {
      const res = await api<{ tarefa: Tarefa }>(
        `/api/tarefas/${tarefa.id}/comentarios?cid=${cid}`,
        { method: "DELETE" }
      );
      onUpdate(res.tarefa);
    } catch (err: any) {
      toast(err.message, "error");
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn("rounded-xl border transition", tarefa.done ? "bg-surface2 border-border" : "bg-bg2 border-border hover:border-border2")}
    >
      {/* Corpo da tarefa */}
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={toggle}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            tarefa.done
              ? "border-transparent accent-gradient text-white"
              : "border-border2 hover:border-accent"
          )}
        >
          {tarefa.done && <Check size={12} />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={salvarEdicao}
              onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
              className="focus-ring w-full rounded-lg border border-accent bg-bg2 px-2.5 py-1.5 text-sm text-text"
            />
          ) : (
            <div
              className={cn("text-sm leading-relaxed", tarefa.done && "line-through text-faint")}
              onDoubleClick={() => {
                setEditText(tarefa.content);
                setEditing(true);
              }}
            >
              {tarefa.content}
            </div>
          )}

          {/* Imagens */}
          {tarefa.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tarefa.images.map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}

          {/* Arquivos */}
          {tarefa.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tarefa.files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  download={f.name}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface2 px-2.5 py-1 text-xs text-text transition hover:bg-accent/10"
                >
                  <Paperclip size={11} className="text-muted" /> {f.name}
                </a>
              ))}
            </div>
          )}

          {/* Meta-info */}
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-faint">
            <span>{relTime(tarefa.createdAt)}</span>
            {tarefa.comments.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle size={11} /> {tarefa.comments.length}
              </span>
            )}
            {tarefa.images.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon size={11} /> {tarefa.images.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-text"
            title="Detalhes"
          >
            <ChevronDown size={15} className={cn("transition", open && "rotate-180")} />
          </button>
          <button
            onClick={remover}
            className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-danger"
            title="Apagar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Seção expandida: comentários */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-2.5">
              {/* Comentários */}
              {tarefa.comments.map((c) => (
                <div key={c.id} className="group flex gap-2.5 rounded-lg bg-surface2 p-2.5">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: c.authorAvatar }}
                  >
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text">{c.authorName}</span>
                      <span className="text-[10px] text-faint">{relTime(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{c.text}</p>
                  </div>
                  <button
                    onClick={() => removerComentario(c.id)}
                    className="mt-0.5 shrink-0 text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Form de comentário */}
              <form onSubmit={addComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Comentar…"
                  className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3 py-2 text-xs text-text placeholder:text-faint"
                />
                <button
                  type="submit"
                  disabled={busy || !commentText.trim()}
                  className="shrink-0 rounded-xl bg-accent/12 p-2 text-accent transition hover:bg-accent/20 disabled:opacity-40"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
