"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Music, Search, Plus, Trash2, Loader2, X, Play } from "lucide-react";
import { toast } from "./Avisos";
import { cn } from "@/nucleo/utilitarios";
import { listItem } from "@/nucleo/movimento";
import { usarRadio, CapaRadio, BarrasAudio } from "./ReprodutorRadio";
import { RadioAoVivo } from "./RadioAoVivo";
import { SpotifyPlaylistImporter } from "./ImportadorPlaylistSpotify";

type Faixa = { id: string; name: string; artist: string; image: string | null };

export function RadioPage({ coupled }: { coupled: boolean }) {
  const reduced = useReducedMotion();
  const { songs, current, play, addMusica, removeMusica } = usarRadio();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Faixa[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

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

  async function add(t: Faixa) {
    setAdding(t.id);
    try {
      await addMusica(t);
      setQuery("");
      setResults([]);
      setOpen(false);
    } catch {
      // toast já veio do contexto
    } finally {
      setAdding(null);
    }
  }

  async function remove(id: string) {
    removeMusica(id);
  }

  return (
    <div className={cn(current && "pb-40")}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-text">
            A rádio <span className="gradient-text">de vocês</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            As músicas que contam a história de vocês — da retrospectiva e as que vocês adicionarem.
          </p>
        </div>
        {coupled && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 rounded-2xl accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            <span className="flex items-center gap-1.5">
              <Plus size={16} /> Música
            </span>
          </motion.button>
        )}
      </div>

      {/* Rádio ao vivo: fica recolhida e só toca se vocês pedirem. */}
      <RadioAoVivo />

      {coupled && <SpotifyPlaylistImporter />}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 overflow-hidden"
          >
            <div className="scrap-frame scrap-frame-quiet rounded-3xl border border-border bg-surface p-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  placeholder="Buscar por música ou artista…"
                  className="focus-ring w-full rounded-full border border-border bg-bg2 py-2.5 pl-10 pr-9 text-sm text-text placeholder:text-faint"
                />
                {query && (
                  <button
                    onClick={() => onQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-text"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-faint" />
                </div>
              )}

              {searchError && (
                <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-center text-xs text-danger">{searchError}</p>
              )}

              {!searching && results.length > 0 && (
                <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                  {results.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => add(t)}
                      disabled={adding === t.id}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface2 disabled:opacity-60"
                    >
                      <CapaRadio url={t.image} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">{t.name}</span>
                        <span className="block truncate text-xs text-muted">{t.artist}</span>
                      </span>
                      {adding === t.id ? (
                        <Loader2 size={16} className="shrink-0 animate-spin text-accent" />
                      ) : (
                        <Plus size={16} className="shrink-0 text-faint" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!searching && query && !searchError && results.length === 0 && (
                <p className="py-4 text-center text-xs text-faint">Nenhuma música encontrada.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist */}
      {songs === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface2/50" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <Music size={26} />
          </span>
          <p className="font-display text-2xl text-text">A rádio está em silêncio</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            {coupled
              ? "Adicione a primeira música — ou escolha uma trilha na retrospectiva de vocês."
              : "Conecte-se com seu amor para montar a rádio de vocês."}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {songs.map((s, i) => {
              const active = current?.id === s.id;
              return (
                <motion.li
                  key={s.id}
                  layout
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  custom={i}
                >
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border p-2.5 transition",
                      active ? "border-accent/50 bg-accent/8" : "border-border bg-surface hover:bg-surface2"
                    )}
                  >
                    <button onClick={() => play(s)} className="relative shrink-0" title="Tocar">
                      <CapaRadio url={s.image} size={48} />
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 text-white transition",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {active ? <BarrasAudio reduced={!!reduced} /> : <Play size={16} className="fill-white" />}
                      </span>
                    </button>

                    <button onClick={() => play(s)} className="min-w-0 flex-1 text-left">
                      <span className={cn("block truncate text-sm font-semibold", active ? "text-accent" : "text-text")}>
                        {s.trackName}
                      </span>
                      <span className="block truncate text-xs text-muted">{s.artist}</span>
                    </button>

                    {!s.fromRadio && (
                      <span className="hidden shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-faint sm:inline">
                        retrô {s.year}
                      </span>
                    )}

                    <button
                      onClick={() => remove(s.id)}
                      title="Remover"
                      className="shrink-0 rounded-lg p-1.5 text-faint transition hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
