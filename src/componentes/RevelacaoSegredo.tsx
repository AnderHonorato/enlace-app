"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Avatar } from "./Avatar";
import { api } from "@/nucleo/cliente";
import { openLightbox } from "./VisualizadorMidia";
import { EASE_OUT, spring } from "@/nucleo/movimento";

type SecretSender = { name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null };
type PendingSecret = {
  id: string;
  kind: string;
  prompt: string;
  eventId: string | null;
  opened: boolean;
  createdAt: string;
  sender: SecretSender | null;
};
type RevealedSecret = {
  id: string;
  kind: string;
  prompt: string;
  message: string;
  image: string | null;
  sender: SecretSender;
};

/**
 * Recebe e revela segredos do parceiro.
 *
 * Fica montado no app inteiro (AppShell): faz um poll leve, e quando há um
 * segredo lacrado abre um modal com um envelope desenhado que se abre revelando
 * o conteúdo. A surpresa é o ponto — por isso o conteúdo só chega ao abrir.
 */
export function SecretReveal({ coupled }: { coupled: boolean }) {
  const reduced = useReducedMotion();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [queue, setQueue] = useState<PendingSecret[]>([]);
  const [stage, setStage] = useState<"sealed" | "opening" | "revealed">("sealed");
  const [revealed, setRevealed] = useState<RevealedSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;

  const poll = useCallback(() => {
    if (!coupled || document.visibilityState === "hidden") return;
    api<{ pending: PendingSecret[] }>("/api/secrets")
      .then((r) => {
        setQueue((q) => {
          // mantém o que já está na fila e acrescenta os novos
          const ids = new Set(q.map((s) => s.id));
          const fresh = r.pending.filter((s) => !ids.has(s.id) && !seen.current.has(s.id));
          return [...q, ...fresh];
        });
      })
      .catch(() => {});
  }, [coupled]);

  // Poll periódico + ao voltar o foco para a aba.
  useEffect(() => {
    if (!coupled) return;
    poll();
    const id = setInterval(poll, 30_000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [coupled, poll]);

  // Deep link da notificação (?segredo=1) força um poll imediato.
  useEffect(() => {
    if (params.get("segredo")) {
      poll();
      // limpa o parâmetro para não re-disparar
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Cada segredo novo entra lacrado.
  useEffect(() => {
    if (current) {
      setStage("sealed");
      setRevealed(null);
    }
  }, [current?.id]);

  async function open() {
    if (!current || busy) return;
    setBusy(true);
    setStage("opening");
    try {
      const res = await api<{ secret: RevealedSecret }>(`/api/secrets/${current.id}`, { method: "PUT" });
      // pequena espera para a animação do envelope abrir antes de revelar
      setTimeout(() => {
        setRevealed(res.secret);
        setStage("revealed");
      }, reduced ? 0 : 620);
    } catch {
      setStage("sealed");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    if (current) seen.current.add(current.id);
    setQueue((q) => q.slice(1));
    setStage("sealed");
    setRevealed(null);
  }

  if (!current) return null;
  const senderName = current.sender ? current.sender.displayName || current.sender.name : "Seu amor";

  const modal = (
    <AnimatePresence>
      <motion.div
        key="secret-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-black/70 p-6 backdrop-blur-md"
        onClick={stage === "revealed" ? dismiss : undefined}
      >
        {/* faíscas de fundo */}
        {!reduced && <Sparkles />}

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={spring.snappy}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm"
          style={{ perspective: 1200 }}
        >
          <AnimatePresence mode="wait">
            {stage !== "revealed" ? (
              <motion.div
                key="envelope"
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                className="flex flex-col items-center text-center text-white"
              >
                <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                  Você recebeu um segredo
                </p>
                <div className="mb-4 flex items-center gap-2 text-white/90">
                  {current.sender && (
                    <Avatar
                      name={senderName}
                      color={current.sender.avatarColor}
                      url={current.sender.avatarUrl}
                      size={26}
                    />
                  )}
                  <span className="text-[15px]">
                    de <b>{senderName}</b>
                  </span>
                </div>

                <Envelope opening={stage === "opening"} reduced={!!reduced} />

                <p className="mt-5 max-w-[16rem] text-sm text-white/70">"{current.prompt}"</p>

                {stage === "sealed" && (
                  <motion.button
                    onClick={open}
                    disabled={busy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 rounded-full bg-surface px-8 py-3 font-bold text-accentInk shadow-2xl transition disabled:opacity-70"
                  >
                    Abrir segredo
                  </motion.button>
                )}
              </motion.div>
            ) : (
              revealed && (
                <motion.div
                  key="letter"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, rotateX: -25 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                  className="overflow-hidden rounded-3xl bg-surface p-6 shadow-2xl"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <Avatar
                      name={senderName}
                      color={revealed.sender.avatarColor}
                      url={revealed.sender.avatarUrl}
                      size={38}
                    />
                    <div className="text-left">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-accentInk">
                        Segredo de {senderName}
                      </div>
                      <div className="text-xs text-muted">"{revealed.prompt}"</div>
                    </div>
                  </div>

                  {revealed.image && (
                    <motion.button
                      type="button"
                      onClick={() => openLightbox([revealed.image!], 0)}
                      initial={reduced ? {} : { scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, ...spring.soft }}
                      className="mb-3 block w-full overflow-hidden rounded-2xl border-2 border-white shadow-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={revealed.image} alt="" className="max-h-72 w-full cursor-zoom-in object-cover" />
                    </motion.button>
                  )}

                  {revealed.message && (
                    <motion.p
                      initial={reduced ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="whitespace-pre-wrap font-display text-xl leading-snug text-text"
                    >
                      {revealed.message}
                    </motion.p>
                  )}

                  <button
                    onClick={dismiss}
                    className="mt-5 w-full rounded-full accent-gradient py-3 font-semibold text-white transition hover:brightness-110"
                  >
                    Guardar no coração 💜
                  </button>
                  {queue.length > 1 && (
                    <p className="mt-2 text-center text-xs text-muted">
                      +{queue.length - 1} segredo{queue.length - 1 > 1 ? "s" : ""} esperando
                    </p>
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}

/* ── Envelope desenhado, com selo de coração que abre ── */
function Envelope({ opening, reduced }: { opening: boolean; reduced: boolean }) {
  return (
    <motion.div
      animate={reduced ? {} : opening ? {} : { y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: opening ? 0 : Infinity, ease: "easeInOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <svg width="200" height="150" viewBox="0 0 200 150" className="drop-shadow-2xl">
        <defs>
          <linearGradient id="env-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7D9E8" />
            <stop offset="1" stopColor="#E9A9C9" />
          </linearGradient>
          <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4C9DE" />
            <stop offset="1" stopColor="#E294BC" />
          </linearGradient>
          <linearGradient id="env-heart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4726A" />
            <stop offset="1" stopColor="#E5679B" />
          </linearGradient>
        </defs>

        {/* corpo do envelope */}
        <rect x="20" y="40" width="160" height="100" rx="10" fill="url(#env-body)" />
        {/* dobras internas */}
        <path d="M20 50 L100 108 L180 50" fill="none" stroke="#D98CB4" strokeWidth="2" opacity="0.5" />
        <path d="M20 138 L74 96 M180 138 L126 96" stroke="#D98CB4" strokeWidth="2" opacity="0.4" />

        {/* carta que sobe ao abrir */}
        <motion.rect
          x="42"
          y="52"
          width="116"
          height="80"
          rx="6"
          fill="#FFFDF7"
          initial={false}
          animate={opening ? { y: reduced ? 52 : -18, opacity: 1 } : { y: 52, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT, delay: opening ? 0.15 : 0 }}
        />

        {/* aba superior que abre girando */}
        <motion.g
          style={{ originX: "100px", originY: "50px" }}
          initial={false}
          animate={opening ? { rotateX: reduced ? 0 : -165 } : { rotateX: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <path d="M20 50 L20 46 Q20 40 26 40 L174 40 Q180 40 180 46 L180 50 L100 104 Z" fill="url(#env-flap)" />
        </motion.g>

        {/* selo de coração */}
        <motion.g
          initial={false}
          animate={opening ? { scale: 0, opacity: 0 } : { scale: [1, 1.12, 1], opacity: 1 }}
          transition={
            opening
              ? { duration: 0.25 }
              : { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
          }
          style={{ originX: "100px", originY: "78px" }}
        >
          <circle cx="100" cy="78" r="20" fill="url(#env-heart)" />
          <path
            d="M100 88 c-1 0 -1.6 -0.5 -2.2 -1.1 l-6.6 -6.5 c-2.2 -2.2 -2.2 -5.9 0 -8.1 2 -2 5.2 -2 7.2 0 l1.6 1.6 1.6 -1.6 c2 -2 5.2 -2 7.2 0 2.2 2.2 2.2 5.9 0 8.1 l-6.6 6.5 c-0.6 0.6 -1.2 1.1 -2.2 1.1 z"
            fill="#fff"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function Sparkles() {
  const bits = Array.from({ length: 22 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {bits.map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const size = 3 + (i % 4);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i % 7) * 0.3 }}
          />
        );
      })}
    </div>
  );
}
