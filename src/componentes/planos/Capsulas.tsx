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

function diasAte(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

const VESSELS: Record<string, { emoji: string; label: string; grad: [string, string] }> = {
  bottle: { emoji: "🍾", label: "Garrafa", grad: ["#4ABEB0", "#5AA0F0"] },
  globe: { emoji: "🔮", label: "Globo de Neve", grad: ["#9575E8", "#E5679B"] },
  chest: { emoji: "📦", label: "Baú do Tesouro", grad: ["#F0883E", "#E5679B"] },
  bear: { emoji: "🧸", label: "Urso de Pelúcia", grad: ["#E5679B", "#F4726A"] },
  box: { emoji: "🎁", label: "Caixa de Memórias", grad: ["#5AA0F0", "#9575E8"] },
};

export function QuadroCapsulas({ initial }: { initial: Capsula[] }) {
  const [capsules, setCapsulas] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [step, setEtapa] = useState<"write" | "vessel">("write");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [vessel, setVessel] = useState("bottle");
  const [busy, setBusy] = useState(false);

  // items adicionais
  const [extraItems, setExtraItems] = useState<{ message: string; mood: string }[]>([]);
  const [newItemMsg, setNewItemMsg] = useState("");
  const [newItemMood, setNewItemMood] = useState("");

  function addExtraItem() {
    if (!newItemMsg.trim()) return;
    setExtraItems((arr) => [...arr, { message: newItemMsg.trim(), mood: newItemMood }]);
    setNewItemMsg("");
    setNewItemMood("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !openAt) return;
    setBusy(true);
    try {
      const res = await api<{ capsule: Capsula }>("/api/capsules", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          openAt: new Date(`${openAt}T12:00:00`).toISOString(),
          vessel,
          items: extraItems.length > 0 ? extraItems : undefined,
        }),
      });
      setCapsulas((c) => [...c, res.capsule].sort((a, b) => a.openAt.localeCompare(b.openAt)));
      setTitle("");
      setContent("");
      setOpenAt("");
      setVessel("bottle");
      setExtraItems([]);
      setEtapa("write");
      setShowForm(false);
      toast("Cápsula lacrada 💌 · +10 pts", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function open(c: Capsula) {
    try {
      const res = await api<{ capsule: Capsula }>(`/api/capsules/${c.id}`, { method: "PATCH" });
      setCapsulas((arr) => arr.map((x) => (x.id === c.id ? res.capsule : x)));
    } catch (err: any) {
      toast(err.message, "error");
    }
  }

  async function remove(id: string) {
    const ok = await confirmDialog({ title: "Apagar cápsula?", danger: true, confirmLabel: "Apagar" });
    if (!ok) return;
    setCapsulas((arr) => arr.filter((x) => x.id !== id));
    await api(`/api/capsules/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border2 py-4 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
        >
          <Package size={17} /> Criar uma cápsula do tempo
        </button>
      ) : step === "write" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3 p-4">
          <p className="text-sm font-medium text-text">Etapa 1 — O que vai dentro?</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Escreva a mensagem principal… fica lacrada até a data escolhida 💌"
            className="focus-ring w-full resize-none rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />

          {/* itens extras */}
          {extraItems.length > 0 && (
            <div className="space-y-1.5">
              {extraItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-sm text-text">
                  <span className="text-xs text-muted">{i + 1}.</span>
                  <span className="flex-1 truncate">{item.message}</span>
                  {item.mood && <span className="text-xs text-accent">{item.mood}</span>}
                  <button onClick={() => setExtraItems((arr) => arr.filter((_, j) => j !== i))} className="text-faint hover:text-danger">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newItemMsg}
              onChange={(e) => setNewItemMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExtraItem()}
              placeholder="Adicionar memória extra…"
              className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3 py-2 text-xs text-text placeholder:text-faint"
            />
            <input
              value={newItemMood}
              onChange={(e) => setNewItemMood(e.target.value)}
              placeholder="Humor"
              className="focus-ring w-20 rounded-xl border border-border bg-bg2 px-2 py-2 text-xs text-text placeholder:text-faint"
            />
            <button type="button" onClick={addExtraItem} className="rounded-xl border border-border px-3 py-2 text-xs text-muted hover:text-accent">
              <Plus size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setExtraItems([]); }} className="rounded-xl border border-border px-4 py-2 text-sm text-muted">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setEtapa("vessel")}
              disabled={!content.trim()}
              className="ml-auto flex items-center gap-1.5 rounded-xl accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              Próximo <Sparkles size={14} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 p-4">
          <p className="text-sm font-medium text-text">Etapa 2 — Escolha o recipiente</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Object.entries(VESSELS).map(([key, v]) => (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setVessel(key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition ${
                  vessel === key ? "border-accent bg-accent/8" : "border-border bg-surface2 hover:border-accent/40"
                }`}
              >
                <motion.span
                  animate={vessel === key ? { rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="text-2xl"
                >
                  {v.emoji}
                </motion.span>
                <span className="text-[10px] text-muted">{v.label}</span>
              </motion.button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            Abrir em:
            <input
              type="date"
              value={openAt}
              min={minDate}
              onChange={(e) => setOpenAt(e.target.value)}
              className="focus-ring rounded-xl border border-border bg-bg2 px-3 py-2 text-text"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEtapa("write")} className="rounded-xl border border-border px-4 py-2 text-sm text-muted">
              Voltar
            </button>
            <button
              onClick={create}
              disabled={busy || !content.trim() || !openAt}
              className="ml-auto flex items-center gap-1.5 rounded-xl accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />} Lacrar cápsula
            </button>
          </div>
        </motion.div>
      )}

      {capsules.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-faint">
          Nenhuma cápsula ainda. Escreva hoje o que vocês vão ler no futuro 💌
        </p>
      )}

      <AnimatePresence>
        {capsules.map((c) => {
          const v = VESSELS[c.vessel] || VESSELS.bottle;
          const opened = c.unlocked && c.openedAt;
          return (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className={cn("card overflow-hidden", !c.unlocked && "bg-surface2")}
            >
              {/* cabeçalho */}
              <div className="flex items-center gap-3 p-4">
                <motion.span
                  animate={!c.unlocked ? { rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${v.grad[0]}, ${v.grad[1]})`,
                    backgroundClip: "padding-box",
                  }}
                >
                  {v.emoji}
                </motion.span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text">{c.title || "Cápsula do tempo"}</div>
                  <div className="text-xs text-muted">
                    {c.unlocked
                      ? opened
                        ? `Aberta em ${fmtDate(c.openedAt!)} · ${c.items.length || 1} ${c.items.length === 1 ? "memória" : "memórias"}`
                        : "Pronta para abrir!"
                      : (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> Abre em {fmtDate(c.openAt)} · {diasAte(c.openAt)} dia(s)
                        </span>
                      )}
                  </div>
                </div>
                {c.isMine && (
                  <button onClick={() => remove(c.id)} className="shrink-0 text-faint transition hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* botão abrir */}
              {c.unlocked && !c.openedAt && (
                <div className="border-t border-border px-4 py-3">
                  <button onClick={() => open(c)} className="w-full rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
                    Abrir {v.emoji}
                  </button>
                </div>
              )}

              {/* conteúdo revelado */}
              <AnimatePresence>
                {opened && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="space-y-3 p-4">
                      <p className="rounded-xl bg-accent/6 p-3.5 text-[15px] italic leading-relaxed text-text">
                        {c.content}
                      </p>
                      {c.items.map((item, i) => (
                        <motion.div
                          key={item.id || i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex gap-3 rounded-xl bg-surface2 p-3"
                        >
                          {item.image && (
                            <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text">{item.message}</p>
                            {item.mood && <span className="text-xs text-accent">{item.mood}</span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
