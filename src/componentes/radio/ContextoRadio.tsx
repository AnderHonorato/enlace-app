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

export type Musica = {
  id: string;
  trackId: string;
  trackName: string;
  artist: string;
  image: string | null;
  fromRadio: boolean;
  year: number;
  createdAt: string;
};

export type Faixa = { id: string; name: string; artist: string; image: string | null };

export function formatarTempoReproducao(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const total = Math.floor(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export type TipoContextoRadio = {
  current: Musica | null;
  queue: Musica[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** Buscando a prévia tocável (iTunes) da faixa atual. */
  loadingPreview: boolean;
  /** Não achamos prévia tocável para a faixa atual. */
  noPreview: boolean;
  play: (song: Musica) => void;
  /** Pausa só o áudio deste aparelho — a seleção (do casal) não muda. */
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  addMusica: (track: Faixa) => Promise<void>;
  removeMusica: (id: string) => Promise<void>;
  songs: Musica[] | null;
};

const ContextoRadio = createContext<TipoContextoRadio | null>(null);

/** Nome técnico começa com `use` para o React reconhecer corretamente o hook. */
export function useRadio() {
  const ctx = useContext(ContextoRadio);
  if (!ctx) throw new Error("useRadio deve ser usado dentro de ProvedorRadio");
  return ctx;
}

/** Mantém o nome em português usado pelo restante do projeto sem quebrar imports. */
export const usarRadio = useRadio;

const CHAVE_ARMAZENAMENTO = "radio-state";
const INTERVALO_SINCRONIZACAO = 30_000;

export function ProvedorRadio({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const radioOpen = pathname.startsWith("/app/radio");
  const [songs, setMusicas] = useState<Musica[] | null>(null);
  const [current, setCurrent] = useState<Musica | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [noPreview, setNoPreview] = useState(false);
  const [locallyClosed, setLocallyClosed] = useState(false);

  // Um único <audio> para toda a rádio (ver o efeito de resolução da prévia,
  // logo abaixo, para o porquê de não ser mais um iframe do Spotify).
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Qual trackId já está carregado no elemento — evita buscar a prévia de
  // novo só porque `isPlaying` mudou (pausar/retomar não deveria refazer a
  // chamada ao /api/musica-preview).
  const resolvedFaixaId = useRef<string | null>(null);
  const storageReady = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      const parsed = raw ? JSON.parse(raw) : {};
      const closed = parsed.closed === true;
      setLocallyClosed(closed);
      if (!closed && parsed.current) setCurrent(parsed.current);
      if (Array.isArray(parsed.queue)) setMusicas(parsed.queue);
    } catch {}
    storageReady.current = true;
  }, []);

  // A playlist só é sincronizada quando a página da Rádio está aberta. Antes,
  // o app inteiro baixava até 300 músicas a cada 30 s, mesmo em silêncio.
  useEffect(() => {
    if (!radioOpen) return;
    let alive = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      api<{ songs: Musica[] }>("/api/radio")
        .then((result) => {
          if (!alive) return;
          setMusicas((previous) => {
            const a = (previous ?? []).map((song) => song.id).sort().join(",");
            const b = result.songs.map((song) => song.id).sort().join(",");
            return a === b ? previous : result.songs;
          });
        })
        .catch(() => setMusicas((previous) => previous ?? []));
    };
    refresh();
    const id = window.setInterval(refresh, INTERVALO_SINCRONIZACAO * 2);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [radioOpen]);

  useEffect(() => {
    if (!storageReady.current) return;
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ current: locallyClosed ? null : current, queue: songs ?? [], closed: locallyClosed }));
    } catch {}
  }, [current, songs, locallyClosed]);

  /*
   * Resolve o trecho tocável sempre que a faixa muda.
   *
   * O bug de "a música não toca": o Spotify parou de devolver `preview_url`
   * para apps novos (vem sempre nulo — ver o comentário em
   * `/api/musica-preview/route.ts`), então esta rádio contornava isso
   * embutindo o player oficial do Spotify num iframe. Só que o iframe não
   * toca sozinho: ele exige um segundo clique *dentro* do widget deles, então
   * clicar em "tocar" aqui no Enlace não emitia som nenhum — parecia quebrado.
   * A correção é a mesma solução que já funciona no Adivinhe a Música: um
   * `<audio>` de verdade, com a prévia de 30s buscada no iTunes.
   */
  useEffect(() => {
    const a = audioRef.current;
    if (!current) {
      a?.pause();
      resolvedFaixaId.current = null;
      setCurrentTime(0);
      setDuration(0);
      setNoPreview(false);
      return;
    }
    if (resolvedFaixaId.current === current.trackId) return;

    let alive = true;
    a?.pause();
    setCurrentTime(0);
    setDuration(0);
    setNoPreview(false);
    setLoadingPreview(true);

    api<{ preview: string | null }>(
      `/api/musica-preview?artista=${encodeURIComponent(current.artist)}&titulo=${encodeURIComponent(current.trackName)}`
    )
      .then((r) => {
        if (!alive) return;
        resolvedFaixaId.current = current.trackId;
        const el = audioRef.current;
        if (!r.preview || !el) {
          setNoPreview(true);
          setIsPlaying(false);
          return;
        }
        el.src = r.preview;
        el.currentTime = 0;
        if (isPlayingRef.current) {
          el.play().catch(() => setIsPlaying(false));
        }
      })
      .catch(() => {
        if (alive) {
          setNoPreview(true);
          setIsPlaying(false);
        }
      })
      .finally(() => {
        if (alive) setLoadingPreview(false);
      });

    return () => {
      alive = false;
    };
  }, [current?.trackId]);

  // Alterna tocar/pausar sem buscar a prévia de novo — só troca o estado do
  // <audio> já carregado.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current || resolvedFaixaId.current !== current.trackId) return;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, current]);

  const play = useCallback((song: Musica) => {
    setLocallyClosed(false);
    setCurrent(song);
    setIsPlaying(true);
    api("/api/radio/agora", {
      method: "POST",
      body: JSON.stringify({
        trackId: song.trackId,
        trackName: song.trackName,
        artist: song.artist,
        image: song.image,
      }),
    }).catch(() => {});
  }, []);

  /** Pausa só o áudio deste aparelho — a faixa continua selecionada para o casal. */
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  /** Fecha a barra: pausa e limpa a seleção local (não mexe no que o par está ouvindo). */
  const stop = useCallback(() => {
    audioRef.current?.pause();
    setLocallyClosed(true);
    setCurrent(null);
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(time)) return;
    a.currentTime = Math.max(0, Math.min(time, Number.isFinite(a.duration) ? a.duration : time));
    setCurrentTime(a.currentTime);
  }, []);

  const next = useCallback(() => {
    const list = songs ?? [];
    if (list.length === 0) return;
    if (!current) {
      play(list[0]);
      return;
    }
    const idx = list.findIndex((s) => s.id === current.id);
    play(list[idx >= 0 ? (idx + 1) % list.length : 0]);
  }, [songs, current, play]);

  const prev = useCallback(() => {
    const list = songs ?? [];
    if (list.length === 0) return;
    if (!current) {
      play(list[0]);
      return;
    }
    const idx = list.findIndex((s) => s.id === current.id);
    play(list[idx >= 0 ? (idx - 1 + list.length) % list.length : list.length - 1]);
  }, [songs, current, play]);

  const addMusica = useCallback(async (track: Faixa) => {
    try {
      const r = await api<{ song: Musica; already?: boolean }>("/api/radio", {
        method: "POST",
        body: JSON.stringify({
          trackId: track.id,
          trackName: track.name,
          artist: track.artist,
          image: track.image,
        }),
      });
      if (r.already) {
        toast("Essa música já está na rádio de vocês 🎵", "info");
      } else {
        setMusicas((s) => [r.song, ...(s ?? [])]);
        toast("Adicionada à rádio 🎶", "success");
      }
    } catch (err: any) {
      toast(err.message, "error");
      throw err;
    }
  }, []);

  const removeMusica = useCallback(
    async (id: string) => {
      setMusicas((prev) => (prev ?? []).filter((x) => x.id !== id));
      if (current?.id === id) {
        audioRef.current?.pause();
        setCurrent(null);
        setIsPlaying(false);
      }
      await api(`/api/radio?id=${id}`, { method: "DELETE" }).catch(() => {});
    },
    [current]
  );

  return (
    <ContextoRadio.Provider
      value={{
        current,
        queue: songs ?? [],
        isPlaying,
        currentTime,
        duration,
        loadingPreview,
        noPreview,
        play,
        pause,
        stop,
        next,
        prev,
        seek,
        addMusica,
        removeMusica,
        songs,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => { setCurrentTime(0); next(); }}
        onError={() => {
          setNoPreview(true);
          setIsPlaying(false);
        }}
      />
    </ContextoRadio.Provider>
  );
}
