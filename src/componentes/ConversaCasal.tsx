"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Heart, Check, CheckCheck, Paperclip, X, FileText } from "lucide-react";
import { Avatar } from "./Avatar";
import { api } from "@/nucleo/cliente";
import { fmtTime, fmtDay, cn } from "@/nucleo/utilitarios";
import { IconBalao } from "./Icones";
import { VoiceNotePlayer } from "./ReprodutorAudio";
import { toast } from "./Avisos";
import type { Me } from "@/nucleo/usuario-atual";

type ChatAttachment = { url: string; type: "audio" | "image" | "video" | "file"; name?: string; size?: number };
type Msg = {
  id: string;
  content: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  readAt: string | null;
  senderId: string;
  isMine: boolean;
  sender: { id: string; name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null };
};

function maxCreatedStamp(msgs: Msg[], base: string): string {
  let m = base;
  for (const x of msgs) if (x.createdAt > m) m = x.createdAt;
  return m;
}

function maxReadStamp(msgs: Msg[], base: string): string {
  let m = base;
  for (const x of msgs) if (x.readAt && x.readAt > m) m = x.readAt;
  return m;
}

export function CoupleChat({ me, initial }: { me: Me; initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastCreatedRef = useRef<string>(maxCreatedStamp(initial, "1970-01-01T00:00:00.000Z"));
  const lastReadRef = useRef<string>(maxReadStamp(initial, "1970-01-01T00:00:00.000Z"));
  const lastTypingPing = useRef(0);
  const partner = me.partner;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, partnerTyping]);

  // Polling: novas mensagens + recibos de leitura + "digitando…".
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await api<{ messages: Msg[]; partnerTyping: boolean }>(
          `/api/chat?after=${encodeURIComponent(lastCreatedRef.current)}&readAfter=${encodeURIComponent(lastReadRef.current)}`
        );
        if (!alive) return;
        setPartnerTyping(res.partnerTyping);
        if (res.messages.length) {
          setMessages((cur) => {
            const byId = new Map(cur.map((m) => [m.id, m]));
            for (const m of res.messages) byId.set(m.id, m); // novo ou readAt atualizado
            const merged = Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            lastCreatedRef.current = maxCreatedStamp(res.messages, lastCreatedRef.current);
            lastReadRef.current = maxReadStamp(res.messages, lastReadRef.current);
            return merged;
          });
        }
      } catch {
        /* falha de rede pontual */
      }
    };
    void poll();
    const id = setInterval(poll, 4000);
    window.addEventListener("focus", poll);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", poll);
    };
  }, []);

  // Ping de "digitando…" (no máx. a cada 2.5s enquanto digita).
  function onType(v: string) {
    setInput(v);
    const now = Date.now();
    if (v.trim() && now - lastTypingPing.current > 2500) {
      lastTypingPing.current = now;
      api("/api/chat/typing", { method: "POST" }).catch(() => {});
    }
  }

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 10 - pendingAttachments.length);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const result = await api<{ url: string; type: ChatAttachment["type"] }>("/api/upload", { method: "POST", body: form });
        uploaded.push({ url: result.url, type: result.type, name: file.name, size: file.size });
      }
      setPendingAttachments((current) => [...current, ...uploaded].slice(0, 10));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !pendingAttachments.length) || sending) return;
    setInput("");
    setUploadError(null);
    setSending(true);
    try {
      const res = await api<{ message: Msg }>("/api/conversa", { method: "POST", body: JSON.stringify({ content, attachments: pendingAttachments }) });
      setMessages((cur) => (cur.some((m) => m.id === res.message.id) ? cur : [...cur, res.message]));
      setPendingAttachments([]);
      lastCreatedRef.current = maxCreatedStamp([res.message], lastCreatedRef.current);
      lastReadRef.current = maxReadStamp([res.message], lastReadRef.current);
    } catch (error) {
      setInput(content);
      const message = error instanceof Error ? error.message : "Não foi possível enviar a mensagem.";
      setUploadError(message);
      toast(message, "error");
    } finally {
      setSending(false);
    }
  }

  let lastDay = "";

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col lg:min-h-[calc(100dvh-6rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        {partner ? (
          <>
            <Avatar name={partner.name} color={partner.avatarColor} url={partner.avatarUrl} size={42} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl leading-none text-text">{partner.displayName || partner.name}</div>
              <div className="h-4 text-xs text-accent">
                {partnerTyping ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    digitando…
                  </motion.span>
                ) : (
                  "conversa de vocês"
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="font-display text-2xl text-text">Conversa</div>
        )}
      </div>

      {!partner && (
        <Link href="/app/config" className="mb-4 rounded-xl border border-accent/30 bg-accent/8 px-3.5 py-2.5 text-sm text-accent">
          Assim que seu amor entrar, tudo que você mandar aqui vai aparecer pra ele(a) 💜
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-1.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-muted">
            <Heart size={30} className="mb-2 text-accent" />
            <p className="inline-flex items-center gap-2 font-display text-2xl text-text">
            Digam “oi”
            <span className="text-accent">
              <IconBalao size={20} />
            </span>
          </p>
            <p className="text-sm">O comecinho de toda boa conversa.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const day = fmtDay(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-surface2 px-3 py-1 text-[11px] font-medium capitalize text-faint">{day}</span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn("flex items-end gap-2", m.isMine && "flex-row-reverse")}
                >
                  {!m.isMine && (
                    <Avatar name={m.sender.displayName || m.sender.name} color={m.sender.avatarColor} url={m.sender.avatarUrl} size={26} className="mb-1 shrink-0" />
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed",
                      m.isMine ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-surface2 text-text"
                    )}
                  >
                    {m.attachments?.map((item, index) => <AttachmentView key={`${item.url}-${index}`} item={item} />)}
                    {m.content && <span className="prose-amora">{m.content}</span>}
                    <span className={cn("ml-2 inline-flex items-center gap-1 align-baseline text-[10px]", m.isMine ? "text-white/70" : "text-faint")}>
                      {fmtTime(m.createdAt)}
                      {m.isMine &&
                        (m.readAt ? (
                          <CheckCheck size={13} className="text-white" aria-label="Visto" />
                        ) : (
                          <Check size={13} aria-label="Enviado" />
                        ))}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Bolha "digitando…" */}
        <AnimatePresence>
          {partnerTyping && partner && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <Avatar name={partner.displayName || partner.name} color={partner.avatarColor} url={partner.avatarUrl} size={26} className="mb-1 shrink-0" />
              <div className="rounded-2xl rounded-bl-sm bg-surface2 px-3.5 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-accent"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Anexos selecionados */}
      {uploadError && <div className="mb-2 rounded-xl border border-danger/30 bg-danger/8 px-3 py-2 text-xs text-danger">{uploadError}</div>}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((item, index) => (
            <span key={`${item.url}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-xs text-accentInk">
              <span className="max-w-[180px] truncate">{item.name || item.type}</span>
              <button type="button" onClick={() => setPendingAttachments((items) => items.filter((_, i) => i !== index))} aria-label="Remover anexo" className="rounded-full p-0.5 hover:bg-accent/15"><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="sticky bottom-24 z-10 mt-4 flex items-center gap-2 lg:bottom-6">
        <input ref={fileRef} type="file" accept="audio/*,image/*,video/*,.pdf,.doc,.docx,.txt,.zip" multiple onChange={onFiles} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || sending} aria-label="Anexar arquivo" title="Anexar áudio, foto, vídeo ou arquivo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition hover:bg-surface2 hover:text-accent disabled:opacity-50">
          <Paperclip size={18} />
        </button>
        <input
          value={input}
          onChange={(e) => onType(e.target.value)}
          placeholder={partner ? `Mensagem para ${partner.displayName || partner.name}…` : "Escreva uma mensagem…"}
          className="focus-ring flex-1 rounded-full border border-border bg-surface px-4 py-3 text-text placeholder:text-faint shadow-soft"
        />
        <button
          type="submit"
          disabled={(!input.trim() && !pendingAttachments.length) || sending || uploading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full accent-gradient text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function AttachmentView({ item }: { item: ChatAttachment }) { if (item.type === "audio") return <VoiceNotePlayer src={item.url} className="min-w-[220px]" />; if (item.type === "image") return <img src={item.url} alt={item.name || "Imagem enviada"} className="max-h-72 max-w-full rounded-xl object-cover" loading="lazy" />; if (item.type === "video") return <video src={item.url} controls preload="metadata" className="max-h-72 max-w-full rounded-xl" />; return <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-current/20 px-3 py-2 text-sm underline-offset-2 hover:underline"><FileText size={17} />{item.name || "Abrir arquivo"}</a>; }
