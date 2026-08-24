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
import { CartaoTarefa } from "./CartaoTarefa";

export function CartaoLista({ lista: initialLista, onDelete }: { lista: Lista; onDelete: (id: string) => void }) {
  const [lista, setLista] = useState(initialLista);
  const [novaTarefa, setNovaTarefa] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(lista.title);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Arquivo[]>([]);

  async function criarTarefa(e: React.FormEvent) {
    e.preventDefault();
    if (!novaTarefa.trim() && !pendingImages.length && !pendingFiles.length) return;
    setBusy(true);
    try {
      const res = await api<{ tarefa: Tarefa }>("/api/tarefas", {
        method: "POST",
        body: JSON.stringify({
          listId: lista.id,
          content: novaTarefa.trim() || "Tarefa sem descrição",
          images: pendingImages,
          files: pendingFiles,
        }),
      });
      setLista((l) => ({ ...l, tasks: [...l.tasks, res.tarefa] }));
      setNovaTarefa("");
      setPendingImages([]);
      setPendingFiles([]);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function atualizarTitulo() {
    if (!titleValue.trim() || titleValue === lista.title) {
      setTitleValue(lista.title);
      setEditingTitle(false);
      return;
    }
    try {
      await api(`/api/listas/${lista.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleValue.trim() }),
      });
      setLista((l) => ({ ...l, title: titleValue.trim() }));
      setEditingTitle(false);
    } catch (err: any) {
      toast(err.message, "error");
      setTitleValue(lista.title);
      setEditingTitle(false);
    }
  }

  async function addImage(file: File) {
    if (pendingImages.length + pendingFiles.length >= 12) {
      toast("Máximo de 12 anexos por tarefa.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImages((p) => [...p, reader.result as string]);
    reader.readAsDataURL(file);
  }

  async function addFile(file: File) {
    if (pendingImages.length + pendingFiles.length >= 12) {
      toast("Máximo de 12 anexos por tarefa.", "error");
      return;
    }
    if (file.size > 10_000_000) {
      toast("Arquivo muito grande (máx 10 MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setPendingFiles((p) => [...p, { name: file.name, url: reader.result as string, size: file.size }]);
    reader.readAsDataURL(file);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.type.startsWith("image/")) addImage(f);
      else addFile(f);
    }
    e.target.value = "";
  }

  const doneCount = lista.tasks.filter((t) => t.done).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-left transition hover:text-accent"
        >
          {expanded ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={atualizarTitulo}
              onKeyDown={(e) => e.key === "Enter" && atualizarTitulo()}
              className="focus-ring rounded-lg border border-accent bg-bg2 px-2 py-1 text-base font-semibold text-text"
            />
          ) : (
            <h2
              className="text-lg font-semibold text-text cursor-pointer"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {lista.title}
            </h2>
          )}
        </button>
        <span className="text-xs text-faint">{doneCount}/{lista.tasks.length}</span>
        <button
          onClick={() => onDelete(lista.id)}
          className="ml-auto rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-danger"
          title="Apagar lista"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4">
              {/* Nova tarefa */}
              <form onSubmit={criarTarefa} className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={novaTarefa}
                    onChange={(e) => setNovaTarefa(e.target.value)}
                    placeholder="Adicionar tarefa…"
                    className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-xl border border-border p-2.5 text-muted transition hover:border-accent hover:text-accent"
                    title="Anexar"
                  >
                    <Paperclip size={17} />
                  </button>
                  <button
                    type="submit"
                    disabled={busy || (!novaTarefa.trim() && !pendingImages.length && !pendingFiles.length)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilePick}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip"
                />

                {/* Preview dos anexos pendentes */}
                {(pendingImages.length > 0 || pendingFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {pendingImages.map((url, i) => (
                      <div key={i} className="relative inline-flex">
                        <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setPendingImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bg2 text-danger shadow ring-1 ring-border"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="relative inline-flex items-center gap-1.5 rounded-lg bg-surface2 px-2.5 py-1.5 text-xs text-text">
                        <Paperclip size={12} className="text-muted" /> {f.name.slice(0, 20)}
                        <button
                          type="button"
                          onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                          className="ml-1 text-faint hover:text-danger"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Lista de tarefas */}
              <div className="space-y-2">
                {lista.tasks.length === 0 && (
                  <p className="py-4 text-center text-xs text-faint">Nenhuma tarefa ainda.</p>
                )}
                <AnimatePresence>
                  {lista.tasks.map((t) => (
                    <CartaoTarefa
                      key={t.id}
                      tarefa={t}
                      onUpdate={(updated) =>
                        setLista((l) => ({
                          ...l,
                          tasks: l.tasks.map((x) => (x.id === updated.id ? updated : x)),
                        }))
                      }
                      onDelete={(id) =>
                        setLista((l) => ({
                          ...l,
                          tasks: l.tasks.filter((x) => x.id !== id),
                        }))
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
