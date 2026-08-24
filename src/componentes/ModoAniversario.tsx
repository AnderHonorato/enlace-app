"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Heart, Send, X } from "lucide-react";
import type { Me } from "@/nucleo/usuario-atual";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { Avatar } from "./Avatar";

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

/** Modo festa — aparece automaticamente em datas especiais. */
export function BirthdayMode({ me, photos = [] }: { me: Me; photos?: string[] }) {
  const [show, setShow] = useState(false);
  const [event, setEvent] = useState<{ id: string; emoji: string; text: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let ev: { id: string; emoji: string; text: string } | null = null;
    const partnerName = me.partner?.displayName || me.partner?.name || "seu amor";
    if (isToday(me.couple?.anniversary)) ev = { id: "event", emoji: "❤️", text: "Feliz aniversário de namoro! Hoje é dia de comemorar vocês." };
    else if (isToday(me.partner?.birthday)) ev = { id: "event", emoji: "🎂", text: `Hoje é aniversário de ${partnerName}! Que tal uma surpresa?` };
    else if (isToday(me.birthday)) ev = { id: "event", emoji: "🎉", text: "Feliz aniversário! Que seu dia seja cheio de amor." };
    else if (isToday(me.couple?.metDate)) ev = { id: "met-date", emoji: "✨", text: "Hoje é o aniversário do dia em que vocês se conheceram." };
    else ev = customEventToday();
    if (!ev) return;

    // mostra uma vez por dia
    const key = `enlace-festa-${new Date().toDateString()}`;
    try {
      if (localStorage.getItem(key) === "1") {
        setEvent(ev); // ainda liga o modo festivo (bordas), mas sem overlay
        return;
      }
      localStorage.setItem(key, "1");
    } catch {}
    setEvent(ev);
    setShow(true);
  }, [me]);

  async function sendMessage() {
    if (!event || !message.trim() || sending) return;
    setSending(true);
    try {
      await api("/api/conversa", { method: "POST", body: JSON.stringify({ content: `Mensagem do evento — ${event.text} ${message.trim()}` }) });
      setMessage("");
      toast("Mensagem enviada para o seu amor.", "success");
    } catch (error: any) {
      toast(error?.message || "Não foi possível enviar a mensagem.", "error");
    } finally {
      setSending(false);
    }
  }

  if (!event) return null;

  const colors = ["#E5679B", "#9575E8", "#F0883E", "#4ABEB0", "#E0A84A", "#5AA0F0"];

  return (
    <>
      {/* faixa fixa no topo do conteúdo */}
      <div className="mb-5 flex items-center gap-2.5 rounded-3xl border border-accent/30 bg-accent/8 p-3.5 text-sm">
        <span className="text-2xl">{event.emoji}</span>
        <span className="font-medium text-text">{event.text}</span>
      </div>

      {/* overlay de comemoração (uma vez por dia) */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
            className="fixed inset-0 z-[125] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, y: -20, x: 0, rotate: 0 }}
                animate={{
                  opacity: 0,
                  y: [0, 240 + (i % 6) * 40],
                  x: (i % 2 ? 1 : -1) * (20 + (i % 9) * 30),
                  rotate: (i % 2 ? 1 : -1) * 480,
                }}
                transition={{ duration: 2.6, delay: (i % 8) * 0.05, ease: "easeOut" }}
                className="absolute h-3 w-2 rounded-sm"
                style={{ top: "10%", background: colors[i % colors.length] }}
              />
            ))}
            <motion.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              onClick={(e) => e.stopPropagation()} className="card relative max-w-md p-7 text-center"
            >
              <button onClick={() => setShow(false)} className="absolute right-3 top-3 text-faint hover:text-text">
                <X size={18} />
              </button>
              <motion.div
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-7xl"
              >
                {event.emoji}
              </motion.div>
              <p className="mt-3 font-display text-2xl leading-snug text-text">{event.text}</p>
              {photos.length > 0 && <div className="mb-4 grid grid-cols-3 gap-1.5">{photos.map((src, index) => <img key={`${src}-${index}`} src={src} alt="Memória do casal" loading="lazy" decoding="async" className="h-20 w-full rounded-xl object-cover" />)}</div>}
              <div className="mt-4 flex items-center justify-center gap-2"><Avatar name={me.name} color={me.avatarColor} url={me.avatarUrl} size={40} /><Heart size={17} className="text-accent" fill="currentColor" />{me.partner && <Avatar name={me.partner.name} color={me.partner.avatarColor} url={me.partner.avatarUrl} size={40} />}</div>
              <div className="mt-4 text-left"><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-accentInk">Escreva uma mensagem para o seu amor</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Guarde uma frase neste momento…" className="focus-ring w-full resize-none rounded-2xl border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-faint" /><button type="button" onClick={sendMessage} disabled={!message.trim() || sending} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"><Send size={15} />{sending ? "Enviando…" : "Enviar para o meu amor"}</button></div>
              <button
                onClick={() => setShow(false)}
                className="mt-5 w-full rounded-xl accent-gradient py-2.5 font-semibold text-white shadow-glow"
              >
                Vamos comemorar!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
function customEventToday(): { id: string; emoji: string; text: string } | null { try { const list = JSON.parse(localStorage.getItem("enlace-custom-events") || "[]"); const item = Array.isArray(list) ? list.find((value) => value && isToday(value.date)) : null; return item ? { id: String(item.id), emoji: typeof item.emoji === "string" ? item.emoji : "✨", text: typeof item.text === "string" ? item.text : "Hoje é um dia marcante para vocês." } : null; } catch { return null; } }
