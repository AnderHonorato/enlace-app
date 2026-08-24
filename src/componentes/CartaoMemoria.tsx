"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, Lock, Users, LockKeyhole, Unlock, Loader2, History } from "lucide-react";
import { Avatar } from "./Avatar";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { confirmDialog } from "./DialogoConfirmacao";
import { moodOf } from "@/nucleo/humores";
import { fmtTime, fmtDateShort, relTime, isRetroactive, cn } from "@/nucleo/utilitarios";
import { EASE_OUT, duration } from "@/nucleo/movimento";
import type { EntryDTO } from "@/nucleo/memorias";
import type { Me } from "@/nucleo/usuario-atual";
import { ConteudoMemoria } from "./cartao-memoria/ConteudoMemoria";
import { InteracoesMemoria } from "./cartao-memoria/InteracoesMemoria";

export function CartaoMemoria({
  entry: initial,
  me,
  onDelete,
  /** Memória apontada por uma notificação — recebe um realce temporário. */
  highlight = false,
  /** Abrir os comentários já expandidos (deep link de comentário). */
  openComments = false,
  /** Comentário específico a destacar dentro da memória. */
  highlightCommentId = null,
  /** Memória que o usuário ainda não viu — ganha selo "novo". */
  isNew = false,
  /** Chamado uma vez quando a memória nova entra na tela. */
  onSeen,
}: {
  entry: EntryDTO;
  me: Me;
  onDelete: (id: string) => void;
  highlight?: boolean;
  openComments?: boolean;
  highlightCommentId?: string | null;
  isNew?: boolean;
  onSeen?: () => void;
}) {
  const [entry, setEntry] = useState(initial);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lockPwd, setLockPwd] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showLockInput, setShowLockInput] = useState(false);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [resolvedPlace, setResolvedPlace] = useState<string | null>(null);

  // O feed recebe versões atualizadas por navegação e polling. Espelha todos
  // os campos controlados localmente para que comentários, reações e anexos
  // recém-chegados não fiquem presos aos valores da primeira renderização.
  useEffect(() => {
    setEntry(initial);
  }, [initial]);

  useEffect(() => {
    if (entry.place || entry.lat == null || entry.lng == null) { setResolvedPlace(null); return; }
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${entry.lat}&lon=${entry.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const a = data?.address ?? {};
        const street = [a.road, a.house_number].filter(Boolean).join(", ");
        const city = a.city || a.town || a.village || a.municipality;
        const label = [street, a.neighbourhood || a.suburb, city, a.state].filter(Boolean).join(" · ");
        if (label) setResolvedPlace(label);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [entry.place, entry.lat, entry.lng]);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  // Deep link: rola até a memória apontada pela notificação.
  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(
      () => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      120
    );
    return () => clearTimeout(t);
  }, [highlight]);

  // "Visto ao rolar": quando a memória nova aparece na tela, avisa o feed uma
  // vez e o selo "novo" some suavemente.
  const [showNew, setShowNew] = useState(isNew);
  useEffect(() => {
    if (!isNew || !rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onSeen?.();
          // deixa o selo mais um instante para o usuário perceber que era novo
          setTimeout(() => setShowNew(false), 1600);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const hiddenLocked = entry.locked && !entry.revealed;
  const mood = moodOf(entry.mood);
  const author = entry.author;
  const canInteract = !hiddenLocked && (!entry.isMine ? entry.visibility === "shared" : true);

  async function transcribeAudio(id: string) {
    setTranscribingId(id);
    try {
      const res = await api<{ transcript: string }>(`/api/attachments/${id}/transcribe`, { method: "POST" });
      setEntry((current) => ({ ...current, attachments: current.attachments.map((a) => a.id === id ? { ...a, transcript: res.transcript } : a) }));
      toast("Transcrição pronta em português.", "success");
    } catch (error: any) {
      toast(error?.message || "Não foi possível transcrever este áudio.", "error");
    } finally {
      setTranscribingId(null);
    }
  }

  async function unlockEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!lockPwd.trim()) return;
    setUnlocking(true);
    try {
      const res = await api<{ entry: EntryDTO }>(`/api/entries/${entry.id}/lock`, {
        method: "PUT",
        body: JSON.stringify({ senha: lockPwd }),
      });
      setEntry(res.entry);
      setLockPwd("");
      toast("Memória aberta", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setUnlocking(false);
    }
  }

  async function toggleLock() {
    setMenu(false);
    setShowLockInput(true);
  }

  async function submitLock(e: React.FormEvent) {
    e.preventDefault();
    const senha = lockPwd.trim();
    if (!senha) return;
    setBusy(true);
    try {
      const res = await api<{ locked: boolean; entry: EntryDTO }>(`/api/entries/${entry.id}/lock`, {
        method: "POST",
        body: JSON.stringify({ senha }),
      });
      setEntry(res.entry);
      setLockPwd("");
      setShowLockInput(false);
      toast(res.locked ? "Memória trancada" : "Memória destrancada", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility() {
    const next = entry.visibility === "shared" ? "private" : "shared";
    setMenu(false);
    setEntry((e) => ({ ...e, visibility: next }));
    try {
      await api(`/api/entries/${entry.id}`, { method: "PATCH", body: JSON.stringify({ visibility: next }) });
      toast(next === "shared" ? "Agora seu amor pode ver" : "Agora é só sua", "success");
    } catch (err: any) {
      setEntry((e) => ({ ...e, visibility: next === "shared" ? "private" : "shared" }));
      toast(err.message, "error");
    }
  }

  async function del() {
    const ok = await confirmDialog({
      title: "Apagar memória?",
      message: "Isso não pode ser desfeito.",
      confirmLabel: "Apagar",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/api/entries/${entry.id}`, { method: "DELETE" });
      onDelete(entry.id);
      toast("Memória apagada.", "success");
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }

  return (
    <motion.article
      ref={rootRef as any}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        // Realce que respira duas vezes quando você chega por uma notificação.
        boxShadow: highlight
          ? [
              "0 0 0 0px rgb(var(--accent) /0)",
              "0 0 0 3px rgb(var(--accent) /0.45)",
              "0 0 0 0px rgb(var(--accent) /0)",
              "0 0 0 3px rgb(var(--accent) /0.35)",
              "0 0 0 0px rgb(var(--accent) /0)",
            ]
          : undefined,
      }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{
        duration: duration.slow,
        ease: EASE_OUT,
        boxShadow: { duration: 2.6, times: [0, 0.15, 0.4, 0.6, 1] },
      }}
      className={cn(
        "card relative overflow-hidden transition-shadow",
        showNew && "ring-2 ring-accent/45",
        busy && "pointer-events-none opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 px-5 pb-3">
        <span className="relative shrink-0">
          <Avatar name={author.displayName || author.name} color={author.avatarColor} url={author.avatarUrl} size={36} />
          {/* pontinho pulsante no avatar, reforçando "novo" */}
          {showNew && (
            <motion.span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-accent"
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 1.3, repeat: Infinity }}
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-text">{author.displayName || author.name}</span>
            <AnimatePresence>
              {showNew && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="rounded-full accent-gradient px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-glow"
                >
                  novo
                </motion.span>
              )}
            </AnimatePresence>
            {entry.visibility === "private" && (
              <span title="Só você vê" className="text-faint">
                <Lock size={13} />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] text-faint">
            <span>
              {relTime(entry.entryDate)} · {fmtTime(entry.entryDate)}
            </span>
            {/* Memória retroativa: os dois precisam ver de que dia ela é
                e quando foi realmente publicada. */}
            {isRetroactive(entry.entryDate, entry.createdAt) && (
              <span
                title={`Memória de ${fmtDateShort(entry.entryDate)}, publicada ${relTime(entry.createdAt)}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent"
              >
                <History size={10} />
                Memória de {fmtDateShort(entry.entryDate)} · publicada {relTime(entry.createdAt)}
              </span>
            )}
          </div>
        </div>
        {mood && (
          <span
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ background: `${mood.color}1f`, color: mood.color }}
          >
            <span className="text-sm">{mood.emoji}</span> {mood.label}
          </span>
        )}
        {entry.isMine && (
          <div>
            <button
              ref={menuBtnRef}
              onClick={() => setMenu((m) => !m)}
              className="rounded-lg p-1.5 text-faint transition hover:bg-surface2 hover:text-text"
            >
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {menu && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed z-[160] w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-card"
                    style={{
                      top: (menuBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                      right: window.innerWidth - (menuBtnRef.current?.getBoundingClientRect().right ?? 0),
                    }}
                  >
                    {!entry.locked && (
                      <Link href={`/app/editar/${entry.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface2">
                        <Pencil size={15} /> Editar
                      </Link>
                    )}
                    {me.couple && (
                      <button
                        onClick={toggleVisibility}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text transition hover:bg-surface2"
                      >
                        {entry.visibility === "shared" ? (
                          <>
                            <Lock size={15} /> Tornar só minha
                          </>
                        ) : (
                          <>
                            <Users size={15} className="text-accent" /> Compartilhar
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={toggleLock}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text transition hover:bg-surface2"
                    >
                      {entry.locked ? (
                        <>
                          <Unlock size={15} className="text-accent" /> Destrancar
                        </>
                      ) : (
                        <>
                          <LockKeyhole size={15} /> Trancar com senha
                        </>
                      )}
                    </button>
                    <button onClick={del} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger transition hover:bg-danger/10">
                      <Trash2 size={15} /> Apagar
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Formulário de trancar/destrancar (substitui window.prompt) */}
      {showLockInput && (
        <div className="px-4 pb-2">
          <form onSubmit={submitLock} className="rounded-2xl border border-dashed border-border-2 bg-surface2/40 p-4 text-center">
            <LockKeyhole size={22} className="mx-auto mb-1.5 text-accent" />
            <p className="text-sm text-text">
              {entry.locked ? "Digite a senha para destrancar:" : "Defina uma senha para trancar:"}
            </p>
            <div className="mx-auto mt-2 flex max-w-xs gap-2">
              <input
                type="password"
                value={lockPwd}
                onChange={(e) => setLockPwd(e.target.value)}
                placeholder="Senha"
                autoFocus
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={busy || !lockPwd.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "..." : "OK"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setShowLockInput(false); setLockPwd(""); }}
              className="mt-2 text-xs text-muted hover:text-text"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Trancada — pede a senha antes de mostrar qualquer coisa */}
      {hiddenLocked ? (
        <div className="px-4 pb-4">
          <form onSubmit={unlockEntry} className="rounded-2xl border border-dashed border-border-2 bg-surface2/40 p-5 text-center">
            <LockKeyhole size={26} className="mx-auto mb-2 text-accent" />
            <div className="display text-xl text-text">Memória trancada</div>
            <p className="mt-0.5 text-sm text-muted">Digite a senha para abrir.</p>
            <div className="mx-auto mt-3 flex max-w-xs gap-2">
              <input
                type="password"
                value={lockPwd}
                onChange={(e) => setLockPwd(e.target.value)}
                placeholder="Senha"
                data-unlock-input={entry.id}
                className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3 py-2 text-sm text-text placeholder:text-faint"
              />
              <button
                type="submit"
                disabled={unlocking || !lockPwd.trim()}
                className="rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
              >
                {unlocking ? <Loader2 size={15} className="animate-spin" /> : "Abrir"}
              </button>
            </div>
          </form>
        </div>
      ) : (
      <>
      <ConteudoMemoria
        memoria={entry}
        lugarResolvido={resolvedPlace}
        podeInteragir={canInteract}
        transcrevendoId={transcribingId}
        aoTranscrever={transcribeAudio}
      />
      </>
      )}

      <InteracoesMemoria
        memoria={entry}
        usuario={me}
        podeInteragir={canInteract}
        destaqueComentarioId={highlightCommentId}
        comentariosAbertos={openComments}
      />
    </motion.article>
  );
}
