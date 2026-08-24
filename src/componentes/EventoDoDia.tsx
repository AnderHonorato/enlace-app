"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X, Send, Loader2, Lock, Check } from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { compressImage } from "@/nucleo/imagem";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

type DayEvent = { id: string; emoji: string; prompt: string; kind: "text" | "photo" | "mixed"; placeholder: string };

/**
 * Card do "Evento do dia": um desafio surpresa que, ao ser cumprido, vira um
 * segredo lacrado entregue ao parceiro. Só aparece para casais.
 */
export function EventOfDay() {
  const [event, setEvent] = useState<DayEvent | null>(null);
  const [doneToday, setDoneToday] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ event: DayEvent | null; doneToday: boolean }>("/api/secrets")
      .then((r) => {
        setEvent(r.event);
        setDoneToday(r.doneToday);
      })
      .catch(() => {});
  }, []);

  async function pickImage(files: FileList | null) {
    const f = files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    try {
      const img = await compressImage(f, 1400, 0.72);
      setImage(img.url);
    } catch {
      toast("Não consegui processar a imagem.", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    if (!event) return;
    const needsPhoto = event.kind === "photo";
    if (needsPhoto && !image) return toast("Esse evento pede uma foto.", "info");
    if (!needsPhoto && !message.trim() && !image) return;
    setSending(true);
    try {
      await api("/api/secrets", {
        method: "POST",
        body: JSON.stringify({ eventId: event.id, message: message.trim(), image }),
      });
      setJustSent(true);
      setDoneToday(true);
      setMessage("");
      setImage(null);
      setTimeout(() => setExpanded(false), 1600);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  }

  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="scrap-frame scrap-frame-botanical relative mb-5 overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 to-accent2/10"
    >
      <button
        onClick={() => !doneToday && setExpanded((v) => !v)}
        disabled={doneToday}
        className={cn("flex w-full items-center gap-3 p-4 text-left", !doneToday && "transition hover:bg-white/5")}
      >
        <motion.span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-xl"
          animate={doneToday ? {} : { rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
        >
          {doneToday ? "🔒" : event.emoji}
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Evento do dia</span>
            {doneToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                <Check size={10} /> enviado
              </span>
            )}
          </div>
          <div className="mt-0.5 font-display text-lg leading-tight text-text">{event.prompt}</div>
          {doneToday && (
            <div className="text-xs text-muted">Seu segredo já está a caminho. Volta amanhã 💜</div>
          )}
        </div>
        {!doneToday && (
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-faint">
            ▾
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && !doneToday && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-accent/15 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Lock size={12} className="text-accent" />
                Chega lacrado — seu amor abre com uma surpresa.
              </div>

              {event.kind !== "photo" && (
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={event.placeholder}
                  rows={3}
                  className="focus-ring w-full resize-none rounded-2xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                />
              )}

              {image ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-28 w-28 rounded-2xl border border-border object-cover" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3.5 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-accent"
                >
                  <ImagePlus size={16} /> {event.kind === "photo" ? "Escolher a foto" : "Adicionar foto"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files)} />

              <motion.button
                onClick={send}
                disabled={sending}
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl accent-gradient py-3 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
              >
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
                Enviar segredo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* confirmação animada ao enviar */}
      <AnimatePresence>
        {justSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={spring.bouncy}
              className="text-5xl"
            >
              🔒✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
