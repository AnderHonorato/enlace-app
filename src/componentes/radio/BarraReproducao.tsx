"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  X,
  Search,
  Loader2,
} from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "../Avisos";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";
import type { Me } from "@/nucleo/usuario-atual";


import { CapaRadio } from "./FaixaCabecalho";
import { formatarTempoReproducao, usarRadio, type Faixa } from "./ContextoRadio";

export function ReprodutorRadio({ persistent }: { persistent?: boolean }) {
  const { current, queue, isPlaying, currentTime, duration, loadingPreview, noPreview, play, pause, stop, next, prev, seek, addMusica, removeMusica } =
    usarRadio();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Faixa[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function onQuery(v: string) {
    setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      setSearchError("");
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const r = await fetch(`/api/spotify/search?q=${encodeURIComponent(v.trim())}`).then((x) => x.json());
        if (r.error) {
          setSearchError(r.error);
          setResults([]);
        } else setResults(r.results ?? []);
      } catch {
        setSearchError("Não consegui buscar agora.");
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleAdd(t: Faixa) {
    setAdding(t.id);
    try {
      await addMusica(t);
      setQuery("");
      setResults([]);
    } catch {
      // toast já veio do contexto
    } finally {
      setAdding(null);
    }
  }

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="radio-player-bar"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={spring.snappy}
        className="fixed inset-x-0 z-50 px-2 pb-[env(safe-area-inset-bottom)]"
        // 4.875rem = 78px, a altura da navegação inferior. Se a navegação
        // mudar de altura, este número muda junto ou a barra do
        // rádio passa a cobrir os botões.
        style={{ bottom: "calc(4.875rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-2xl lg:pl-56">
          <div className="overflow-hidden rounded-2xl border border-accent/20 bg-surface/95 p-2 shadow-[0_18px_50px_rgb(0_0_0_/_0.22)] backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent/10 via-surface to-accent2/10 px-2 py-1.5">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <CapaRadio url={current.image} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-text">
                  {current.trackName}
                </span>
                <span className="block truncate text-[11px] text-muted">{current.artist}</span>
              </span>
            </button>

            <div className="flex items-center gap-0.5">
              <button
                onClick={prev}
                className="rounded-lg p-1.5 text-faint transition hover:text-text"
                title="Anterior"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => (isPlaying ? pause() : play(current))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-glow transition hover:scale-105 hover:brightness-110"
                title={isPlaying ? "Pausar" : "Tocar"}
              >
                {loadingPreview ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>
              <button
                onClick={next}
                className="rounded-lg p-1.5 text-faint transition hover:text-text"
                title="Próxima"
              >
                <SkipForward size={16} />
              </button>
              <button
                onClick={stop}
                className="rounded-lg p-1.5 text-faint transition hover:text-text"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/*
            O áudio de verdade mora no ProvedorRadio (sobrevive mesmo sem
            esta barra montada). Aqui só o status: buscando prévia, tocando,
            ou "essa faixa não tem prévia" — nunca um player mudo e parado.
          */}
          <div className="mt-2 rounded-xl bg-bg2/80 px-2.5 py-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!duration}
              aria-label="Progresso da música"
              className="radio-progress w-full"
            />
            <div className="mt-0.5 flex justify-between px-0.5 text-[10px] font-medium tabular-nums text-faint">
              <span>{formatarTempoReproducao(currentTime)}</span>
              <span>{formatarTempoReproducao(duration)}</span>
            </div>
          </div>

          {loadingPreview && (
            <div className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-bg2 px-3 py-2.5 text-xs text-muted">
              <Loader2 size={13} className="animate-spin" />
              Procurando o trecho…
            </div>
          )}
          {!loadingPreview && noPreview && (
            <p className="mt-1 rounded-xl bg-bg2 px-3 py-2.5 text-center text-xs text-faint">
              Não encontramos uma prévia tocável para essa faixa.
            </p>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 border-t border-border pt-2">
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      value={query}
                      onChange={(e) => onQuery(e.target.value)}
                      placeholder="Buscar música para adicionar…"
                      className="focus-ring w-full rounded-full border border-border bg-bg2 py-2 pl-9 pr-8 text-xs text-text placeholder:text-faint"
                    />
                    {query && (
                      <button
                        onClick={() => onQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-text"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {searching && (
                    <div className="flex justify-center py-2">
                      <Loader2 size={16} className="animate-spin text-faint" />
                    </div>
                  )}

                  {searchError && (
                    <p className="mb-2 rounded-lg bg-danger/10 px-2 py-1 text-center text-[11px] text-danger">
                      {searchError}
                    </p>
                  )}

                  {!searching && results.length > 0 && (
                    <div className="mb-2 max-h-40 space-y-0.5 overflow-y-auto">
                      {results.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleAdd(t)}
                          disabled={adding === t.id}
                          className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-surface2 disabled:opacity-60"
                        >
                          <CapaRadio url={t.image} size={32} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-text">{t.name}</span>
                            <span className="block truncate text-[11px] text-muted">{t.artist}</span>
                          </span>
                          {adding === t.id ? (
                            <Loader2 size={14} className="shrink-0 animate-spin text-accent" />
                          ) : (
                            <Plus size={14} className="shrink-0 text-faint" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && query && !searchError && results.length === 0 && (
                    <p className="mb-2 text-center text-[11px] text-faint">Nenhuma música encontrada.</p>
                  )}

                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {queue.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition",
                          s.id === current.id ? "bg-accent/8" : "hover:bg-surface2"
                        )}
                      >
                        <button
                          onClick={() => play(s)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <CapaRadio url={s.image} size={32} />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-xs font-medium",
                                s.id === current.id ? "text-accent" : "text-text"
                              )}
                            >
                              {s.trackName}
                            </span>
                            <span className="block truncate text-[11px] text-muted">{s.artist}</span>
                          </span>
                        </button>
                        <button
                          onClick={() => removeMusica(s.id)}
                          className="shrink-0 rounded-md p-1 text-faint transition hover:text-danger"
                          title="Remover"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Tira de "tocando agora" do cabeçalho

   O QUE toca é do casal; SE está tocando é de cada um. Esta tira mostra a
   faixa que o par escolheu (mesmo que ninguém dos dois esteja com o áudio
   rodando agora) e deixa VOCÊ tocar/pausar seu próprio aparelho a partir
   dela — nunca o do parceiro.
   ──────────────────────────────────────────────────────────────────────────── */
