"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Trash2, KeyRound, Loader2, Volume2, VolumeX } from "lucide-react";
import { CharacterAvatar } from "./AvatarPersonagem";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { confirmDialog } from "./DialogoConfirmacao";
import { speak, stopSpeaking, speechAvailable, CHARACTER_VOICE } from "@/nucleo/fala";
import { cn } from "@/nucleo/utilitarios";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Char = { slug: string; name: string; role: string; accent: string; greeting: string; suggestions: string[] };

export function ChatRoom({
  character,
  initial,
  hasKey,
  opener,
}: {
  character: Char;
  initial: Msg[];
  hasKey: boolean;
  opener?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [needKey, setNeedKey] = useState(!hasKey);
  const [voiceOn, setVoiceOn] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Preferência de voz por personagem
  useEffect(() => {
    try {
      setVoiceOn(localStorage.getItem("enlace-voz") === "1");
    } catch {}
  }, []);

  function toggleVoice() {
    setVoiceOn((v) => {
      const next = !v;
      try {
        localStorage.setItem("enlace-voz", next ? "1" : "0");
      } catch {}
      if (!next) stopSpeaking();
      return next;
    });
  }

  function readAloud(text: string) {
    const tone = CHARACTER_VOICE[character.slug] ?? {};
    if (!speak(text, tone)) toast("Seu navegador não tem leitura em voz.", "error");
  }

  // Para de falar ao sair da conversa
  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (opener && initial.length === 0) setInput(opener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    setInput("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: "user", content };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await api<{ reply: string; id: string }>("/api/ai/conversa", {
        method: "POST",
        body: JSON.stringify({ character: character.slug, message: content }),
      });
      setMessages((m) => [...m, { id: res.id, role: "assistant", content: res.reply }]);
      if (voiceOn) readAloud(res.reply);
    } catch (err: any) {
      if (err.code === "no_key") {
        setNeedKey(true);
        toast("Configure sua chave de IA nas configurações.", "error");
      } else {
        toast(err.message || "Falha ao conversar.", "error");
      }
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    const ok = await confirmDialog({
      title: "Apagar conversa?",
      message: `Isso apaga tudo que você conversou com ${character.name}.`,
      confirmLabel: "Apagar",
      danger: true,
    });
    if (!ok) return;
    setMessages([]);
    await api(`/api/ai/chat?character=${character.slug}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col lg:min-h-[calc(100dvh-6rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app/personagens" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <CharacterAvatar slug={character.slug} size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl leading-none text-text">{character.name}</div>
          <div className="text-xs" style={{ color: character.accent }}>{character.role}</div>
        </div>
        {speechAvailable() && (
          <button
            onClick={toggleVoice}
            title={voiceOn ? "Desligar a voz" : `Ouvir ${character.name} falar`}
            className={cn(
              "rounded-lg p-2 transition",
              voiceOn ? "bg-accent/12 text-accent" : "text-faint hover:bg-surface2 hover:text-text"
            )}
          >
            {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        )}
        {messages.length > 0 && (
          <button onClick={clearHistory} title="Limpar conversa" className="rounded-lg p-2 text-faint transition hover:bg-surface2 hover:text-danger">
            <Trash2 size={17} />
          </button>
        )}
      </div>

      {needKey && (
        <Link href="/app/config" className="mb-4 flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent/8 px-3.5 py-2.5 text-sm text-accent transition hover:bg-accent/12">
          <KeyRound size={16} /> Adicione sua chave de IA para conversar de verdade →
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3">
        {/* Greeting */}
        <Bubble role="assistant" accent={character.accent} slug={character.slug}>
          {character.greeting}
        </Bubble>

        {messages.map((m) => (
          <Bubble
            key={m.id}
            role={m.role}
            accent={character.accent}
            slug={character.slug}
            onSpeak={m.role === "assistant" && speechAvailable() ? () => readAloud(m.content) : undefined}
          >
            {m.content}
          </Bubble>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {character.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent/40 hover:text-text"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Bubble role="assistant" accent={character.accent} slug={character.slug} typing />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-24 z-10 mt-4 flex items-center gap-2 lg:bottom-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Fale com ${character.name}…`}
          className="focus-ring flex-1 rounded-full border border-border bg-surface px-4 py-3 text-text placeholder:text-faint shadow-soft"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full accent-gradient text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  children,
  accent,
  slug,
  typing,
  onSpeak,
}: {
  role: "user" | "assistant";
  children?: React.ReactNode;
  accent: string;
  slug: string;
  typing?: boolean;
  onSpeak?: () => void;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex items-end gap-2", isUser && "flex-row-reverse")}
    >
      {!isUser && <CharacterAvatar slug={slug} size={30} className="mb-0.5 shrink-0" />}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
          isUser
            ? "rounded-br-sm bg-accent text-white"
            : "prose-amora rounded-bl-sm bg-surface2 text-text"
        )}
      >
        {typing ? (
          <span className="flex gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ background: accent }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </span>
        ) : (
          children
        )}
      </div>
      {onSpeak && !typing && (
        <button
          onClick={onSpeak}
          title="Ouvir"
          className="mb-1 shrink-0 rounded-full p-1.5 text-faint opacity-0 transition hover:bg-surface2 hover:text-accent group-hover:opacity-100"
        >
          <Volume2 size={14} />
        </button>
      )}
    </motion.div>
  );
}
