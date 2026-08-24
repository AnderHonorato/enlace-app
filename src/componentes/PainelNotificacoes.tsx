"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, CheckCheck, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { api } from "@/nucleo/cliente";
import { relTime, cn } from "@/nucleo/utilitarios";
import { spring, listItem } from "@/nucleo/movimento";

export type NotificationDTO = {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  emoji: string | null;
  read: boolean;
  createdAt: string;
  actor: { name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null } | null;
};

/** Cor de destaque por tipo de evento. */
const KIND_TINT: Record<string, string> = {
  entry: "text-accent",
  reaction: "text-danger",
  comment: "text-accent",
  comment_like: "text-danger",
  capsule: "text-warning",
  capsule_open: "text-warning",
  task: "text-muted",
  task_comment: "text-muted",
  goal: "text-success",
  wish: "text-warning",
  summary: "text-accent",
  couple: "text-accent",
  chat: "text-accent",
  task_done: "text-success",
  secret: "text-accent",
  ai_comment: "text-accent",
  streak: "text-warning",
  jogo: "text-accent",
};

export function NotificationsPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    api<{ unread: number; notifications: NotificationDTO[] }>("/api/notifications")
      .then((r) => {
        setItems(r.notifications);
        setUnread(r.unread);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Contador: leve, roda sempre. A lista só é buscada ao abrir.
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      api<{ unread: number }>("/api/notifications?count=1")
        .then((r) => alive && setUnread(r.unread))
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  // Atualiza a lista enquanto o painel está aberto.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => clearInterval(id);
  }, [open, load]);

  // Fecha com Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function markAll() {
    setBusy(true);
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api("/api/notifications", { method: "POST", body: JSON.stringify({}) }).catch(() => {});
    setBusy(false);
  }

  async function clearAll() {
    setBusy(true);
    setItems([]);
    setUnread(0);
    await api("/api/notifications", { method: "DELETE" }).catch(() => {});
    setBusy(false);
  }

  /** Marca como lida e navega até a origem do evento. */
  async function openItem(n: NotificationDTO) {
    setOpen(false);
    if (!n.read) {
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api("/api/notifications", { method: "POST", body: JSON.stringify({ id: n.id }) }).catch(() => {});
    }
    if (n.url) {
      router.push(n.url);
      // Garante dados novos mesmo quando o destino é a mesma página que já
      // está aberta (situação em que o App Router pode reutilizar a árvore).
      router.refresh();
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Notificações"
        aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : "Notificações"}
        className={cn(
          "relative rounded-full p-2 transition",
          open ? "bg-accent/12 text-accent" : "text-muted hover:text-accent"
        )}
      >
        <motion.span
          key={unread}
          animate={unread > 0 ? { rotate: [0, -14, 12, -8, 0] } : {}}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="block"
        >
          <Bell size={19} />
        </motion.span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-glow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[190] bg-black/30 backdrop-blur-[2px]"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: compact ? 12 : -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: compact ? 12 : -8, scale: 0.97 }}
                  transition={spring.snappy}
                  className={cn(
                    "fixed z-[200] flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-card",
                    compact
                      ? "inset-x-3 bottom-20 top-auto max-h-[55vh] pb-[env(safe-area-inset-bottom)]"
                      : "left-3 top-16 w-[22rem] lg:left-auto lg:right-4 lg:top-4 max-h-[65vh]"
                  )}
                >
                  <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
                    <Bell size={16} className="text-accent" />
                    <span className="flex-1 font-display text-lg text-text">Notificações</span>
                    {unread > 0 && (
                      <button
                        onClick={markAll}
                        disabled={busy}
                        title="Marcar todas como lidas"
                        className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-accent disabled:opacity-50"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    {items.length > 0 && (
                      <button
                        onClick={clearAll}
                        disabled={busy}
                        title="Limpar tudo"
                        className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-text"
                    >
                      <X size={16} />
                    </button>
                  </header>

                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {loading ? (
                      <div className="flex items-center justify-center py-14">
                        <Loader2 size={20} className="animate-spin text-faint" />
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <BellOff size={26} className="mb-2 text-faint" />
                        <p className="font-display text-lg text-text">Erro ao carregar</p>
                        <p className="mt-1 text-sm text-muted">
                          Não foi possível buscar suas notificações.
                        </p>
                        <button
                          onClick={() => { setLoading(true); setError(false); load(); }}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm text-accent transition hover:bg-surface2"
                        >
                          <RefreshCw size={14} /> Tentar de novo
                        </button>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <BellOff size={26} className="mb-2 text-faint" />
                        <p className="font-display text-xl text-text">Tudo em silêncio</p>
                        <p className="mt-1 text-sm text-muted">
                          Curtidas, comentários e memórias novas aparecem aqui.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        <AnimatePresence initial={false}>
                          {items.map((n, i) => (
                            <motion.li
                              key={n.id}
                              layout
                              variants={listItem}
                              initial="hidden"
                              animate="show"
                              exit="exit"
                              custom={i}
                            >
                              <button
                                onClick={() => openItem(n)}
                                className={cn(
                                  "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface2",
                                  !n.read && "bg-accent/[0.06]"
                                )}
                              >
                                <span className="relative shrink-0">
                                  {n.actor ? (
                                    <Avatar
                                      name={n.actor.displayName || n.actor.name}
                                      color={n.actor.avatarColor}
                                      url={n.actor.avatarUrl}
                                      size={38}
                                    />
                                  ) : (
                                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-accent/12 text-lg">
                                      {n.emoji ?? "✦"}
                                    </span>
                                  )}
                                  {n.actor && n.emoji && (
                                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[11px] ring-1 ring-border">
                                      {n.emoji}
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      "block text-sm leading-snug",
                                      n.read ? "text-muted" : "font-semibold text-text"
                                    )}
                                  >
                                    {n.title}
                                  </span>
                                  {n.body && (
                                    <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.body}</span>
                                  )}
                                  <span
                                    className={cn(
                                      "mt-1 block text-[11px]",
                                      KIND_TINT[n.kind] ?? "text-faint"
                                    )}
                                  >
                                    {relTime(n.createdAt)}
                                  </span>
                                </span>
                                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
