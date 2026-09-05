"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  IconClose,
  IconPause,
  IconPlay,
  IconSpinner,
  IconMusic,
} from "./IconesRetrospectiva";
import { toast } from "./Avisos";
import { gravarVideoRetrospectiva, gravacaoVideoSuportada } from "@/nucleo/video-retrospectiva";
import {
  RetroBackdrop,
  SlideAmbience,
  type Ambience,
  type TimelineItem,
  type JourneyPlace,
  type RetroAppStats,
} from "./CenasRetrospectiva";
import type { Achievement } from "@/nucleo/conquistas";
import { cn } from "@/nucleo/utilitarios";
import { durationOf, gestureOf, roleOf, slideVariants } from "./retro/coreografia";
import { capituloDaCena, criarCenas } from "./retrospectiva/criar-cenas";
import { compartilharRetrospectiva } from "./retrospectiva/compartilhar-imagem";
import { CapaRetrospectiva } from "./retrospectiva/CapaRetrospectiva";
import { ConteudoRetrospectiva } from "./retrospectiva/ConteudoRetrospectiva";
import { SeletorMusica } from "./retrospectiva/SeletorMusica";
import type { DadosRetrospectiva, MusicaRetrospectivaSalva, ResultadoBuscaMusica } from "./retrospectiva/tipos";

export function Retrospectiva({
  data,
  semester,
  otherSemester,
  otherSummary,
  savedSongs,
  aiSong,
}: {
  data: DadosRetrospectiva;
  semester?: number;
  otherSemester?: number;
  otherSummary?: { total: number; topMoodLabel?: string; topMoodEmoji?: string } | null;
  savedSongs?: MusicaRetrospectivaSalva[];
  aiSong?: { name: string; artist: string } | null;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => { setNowMs(Date.now()); }, []);
  const slides = useMemo(() => criarCenas(data, semester, otherSemester, otherSummary, nowMs), [data, semester, otherSemester, otherSummary, nowMs]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recPct, setRecPct] = useState(0);
  const startRef = useRef<number>(Date.now());
  const touchX = useRef<number>(0);
  const touchY = useRef<number>(0);
  const touchBlocked = useRef(false);
  const isLast = i === slides.length - 1;

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    touchBlocked.current = !!target.closest("button, a, input, textarea, select, iframe, [data-retro-interactive]");
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchBlocked.current) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && !isLast) go(1);
    if (dx > 0 && i > 0) go(-1);
  };

  const onContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, iframe, [data-retro-interactive]")) return;
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w / 3 && i > 0) go(-1);
    if (x > (w * 2) / 3 && !isLast) go(1);
  };

  const [spotifyId, setSpotifyId] = useState<string | null>(null);
  const [spotifyName, setSpotifyName] = useState("");
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultadoBuscaMusica[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function doSearch(q: string) {
    if (!q.trim()) { setResults([]); setSearchError(""); return; }
    setSearching(true);
    setSearchError("");
    fetch(`/api/spotify/search?q=${encodeURIComponent(q.trim())}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setSearchError(d.error); setResults([]); return; }
        setResults(d.results ?? []);
      })
      .catch(() => setSearchError("Erro de conexão"))
      .finally(() => setSearching(false));
  }

  function onQueryChange(v: string) {
    setQuery(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v), 350);
  }

  function selectTrack(track: { id: string; name: string; artist: string }) {
    setSpotifyId(track.id);
    setSpotifyName(`${track.name} — ${track.artist}`);
    setShowSpotifyInput(false);
    setQuery("");
    setResults([]);
    setSearchError("");
    toast("Música conectada! 🎵", "success");
  }

  function disconnectSpotify() {
    setSpotifyId(null);
    setSpotifyName("");
    setShowSpotifyInput(false);
    setQuery("");
    setResults([]);
    setSearchError("");
  }

  // ── Músicas por slide ──
  const [songs, setSongs] = useState<MusicaRetrospectivaSalva[]>(savedSongs ?? []);
  useEffect(() => { setSongs(savedSongs ?? []); }, [savedSongs]);
  const songMap = useMemo(() => {
    const m = new Map<string, MusicaRetrospectivaSalva>();
    songs.forEach((s) => m.set(s.slideKey ?? "__default", s));
    return m;
  }, [songs]);

  const [editingSlide, setEditingSlide] = useState(false);
  const curSlideKey = slides[i]?.key ?? "";
  const curSlideSong = songMap.get(curSlideKey);
  const defaultSong = songMap.get("__default");

  async function saveSlideMusic(track: { id: string; name: string; artist: string; image?: string | null }) {
    if (!semester) return;
    const body = {
      year: data.year,
      semester,
      slideKey: curSlideKey,
      trackId: track.id,
      trackName: track.name,
      artist: track.artist,
      image: track.image ?? null,
    };
    try {
      const response = await fetch("/api/retro/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.song) throw new Error(payload.error || "Não foi possível salvar a música.");
      const song = payload.song as MusicaRetrospectivaSalva;
      setSongs((current) => [...current.filter((item) => item.slideKey !== curSlideKey), song]);
      setEditingSlide(false);
      setShowSpotifyInput(false);
      setQuery("");
      setResults([]);
      toast("Música salva neste slide! 🎵", "success");
    } catch (error: any) {
      toast(error?.message || "Não foi possível salvar a música.", "error");
    }
  }

  async function deleteSlideMusic() {
    const song = songMap.get(curSlideKey);
    if (!song?.id) return;
    try {
      const response = await fetch(`/api/retro/music?id=${encodeURIComponent(song.id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível remover a música.");
      setSongs((current) => current.filter((item) => item.id !== song.id));
      toast("Música removida.", "success");
    } catch (error: any) {
      toast(error?.message || "Não foi possível remover a música.", "error");
    }
  }

  // ── Auto-advance ──
  const autoPausedRef = useRef(false);
  useEffect(() => {
    if (!started) return;
    startRef.current = Date.now();
    setProgress(0);
    // Pausa automática na aba de perguntas
    if (slides[i]?.key === "questions" && !paused && !autoPausedRef.current) {
      setPaused(true);
      autoPausedRef.current = true;
    }
    // Despausa ao sair da aba de perguntas
    if (slides[i]?.key !== "questions" && autoPausedRef.current) {
      setPaused(false);
      autoPausedRef.current = false;
    }
    if (paused || isLast) return;
    // Slides com mais conteúdo (mapa estelar, conquistas, contador) duram mais.
    const dur = durationOf(slides[i]);
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - startRef.current) / dur);
      setProgress(p);
      if (p >= 1) setI((x) => Math.min(x + 1, slides.length - 1));
    }, 50);
    return () => clearInterval(id);
  }, [started, i, paused, isLast, slides.length, slides[i]?.key, slides[i]?.ms]);

  // Direção do último movimento — a transição entra do lado certo.
  const [dir, setDir] = useState(1);
  const go = (d: number) => {
    setDir(d >= 0 ? 1 : -1);
    setI((x) => Math.max(0, Math.min(x + d, slides.length - 1)));
  };

  // Controles equivalentes para teclado e pausa automática quando o app perde
  // foco — importante para leitura, acessibilidade e economia no celular.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!started) return;
      if (showSpotifyInput) {
        if (event.key === "Escape") setShowSpotifyInput(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (event.key === "Escape") router.push("/app");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") setPaused(true);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [started, showSpotifyInput, router, slides.length]);

  const cur = slides[i];
  const chapter = capituloDaCena(cur);
  /** Com o player na tela, o conteúdo precisa de mais folga embaixo. */
  const hasMusic = !!(curSlideSong ?? defaultSong ?? spotifyId);
  const editorialDark =
    ["starmap-met", "moon-met", "timeline", "places", "late", "questions"].includes(cur.key) ||
    ["starmap", "moon", "counter", "timeline", "places", "achievements", "wordle", "roleta", "app-pulse", "plans", "games"].includes(cur.layout ?? "");
  const nextSlide = slides[i + 1];
  const choreography = slideVariants(
    gestureOf(roleOf(cur)),
    nextSlide ? gestureOf(roleOf(nextSlide)) : "cortina",
    !!reduced
  );
  const secondaryAction = editorialDark
    ? "bg-white/15 text-white hover:bg-white/25"
    : "border border-[#d8ccb6] bg-[#302c27]/8 text-[#302c27] hover:bg-[#302c27]/15";

  async function share() {
    setSharing(true);
    try {
      await compartilharRetrospectiva(data);
    } catch {
      toast("Não consegui gerar a imagem.", "error");
    } finally {
      setSharing(false);
    }
  }

  async function makeVideo() {
    if (!gravacaoVideoSuportada()) {
      toast("Seu navegador não suporta gravar vídeo. Tente pelo Chrome.", "error");
      return;
    }
    setRecording(true);
    setRecPct(0);
    setPaused(true);
    try {
      const songLabel = curSlideSong ? `${curSlideSong.trackName} — ${curSlideSong.artist}` : defaultSong ? `${defaultSong.trackName} — ${defaultSong.artist}` : spotifyName || undefined;
      const blob = await gravarVideoRetrospectiva(data, (p) => setRecPct(Math.round(p * 100)), songLabel, semester);
      const file = new File([blob], `enlace-retrospectiva-${data.year}.webm`, { type: blob.type });
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: "Nossa retrospectiva" });
          return;
        } catch {
          /* cancelou → baixa */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      toast("Vídeo salvo! 🎬", "success");
    } catch (err: any) {
      toast(err?.message || "Não consegui gerar o vídeo.", "error");
    } finally {
      setRecording(false);
      setPaused(false);
    }
  }

  if (!started) {
    return (
      <CapaRetrospectiva
        dados={data}
        semestre={semester}
        totalCenas={slides.length}
        movimentoReduzido={!!reduced}
        aoFechar={() => router.push("/app")}
        aoComecar={() => {
          startRef.current = Date.now();
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div
      className={cn("fixed inset-0 z-[130] select-none overflow-hidden retro-editorial", editorialDark && "retro-editorial-dark")}
      role="region"
      aria-label={`Retrospectiva de ${data.names}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onContainerClick}
      style={{ background: editorialDark ? "#202633" : "#f6f1e8" }}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {chapter}. Cena {i + 1} de {slides.length}. {cur.title}. {cur.big ?? ""} {cur.sub ?? ""}
      </p>
      {/* Fundo que avança com a história: gradiente girando, bolhas trocando
          de lugar a cada slide e uma luz atravessando na entrada. */}
      <div className="retro-editorial-backdrop"><RetroBackdrop index={i} total={slides.length} grad={cur.grad} /></div>

      {/* Camada de partículas específica do slide */}
      <SlideAmbience kind={cur.ambience ?? "none"} seed={i + 3} />

      {/* barras de progresso */}
      <div className="retro-editorial-progress absolute inset-x-0 top-0 z-20 flex gap-1 p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        {slides.map((s, k) => (
          <div
            key={s.key}
            className={cn(
              "relative h-1 flex-1 overflow-hidden rounded-full bg-white/25 transition-all",
              k === i && "h-1.5 bg-white/35"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full bg-white transition-[width] duration-100",
                k === i && "shadow-[0_0_10px_2px_rgba(255,255,255,0.75)]"
              )}
              style={{ width: k < i ? "100%" : k === i ? `${(isLast ? 1 : progress) * 100}%` : "0%" }}
            />
            {songMap.has(s.key) && (
              <span className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-400" />
            )}
          </div>
        ))}
      </div>

      <motion.div
        key={chapter}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="retro-editorial-chapter absolute left-3 top-8 z-40 flex min-h-11 items-center gap-2 pt-[env(safe-area-inset-top)]"
      >
        <span className="rounded-full border border-current/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur">
          {chapter}
        </span>
        <span className="text-[10px] font-semibold tabular-nums opacity-60">{i + 1}/{slides.length}</span>
      </motion.div>

      <div className="retro-editorial-controls absolute right-3 top-8 z-50 flex items-center gap-1.5 pt-[env(safe-area-inset-top)]">
        {!isLast && (
          <button aria-label={paused ? "Continuar retrospectiva" : "Pausar retrospectiva"} title={paused ? "Continuar" : "Pausar"} onClick={(e) => { e.stopPropagation(); setPaused((p) => !p); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
            {paused ? <IconPlay size={17} /> : <IconPause size={17} />}
          </button>
        )}
        <button
          aria-label="Escolher música"
          title="Escolher música"
          onClick={(e) => { e.stopPropagation(); setPaused(true); setEditingSlide(true); setShowSpotifyInput((v) => !v); }}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-white backdrop-blur transition hover:bg-white/25 ${(curSlideSong ?? defaultSong ?? spotifyId) ? "bg-green-500/60" : "bg-white/15"}`}
        >
          <IconMusic size={17} />
        </button>
        <button aria-label="Fechar retrospectiva" title="Fechar" onClick={(e) => { e.stopPropagation(); router.push("/app"); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
          <IconClose size={19} />
        </button>
      </div>

      <ConteudoRetrospectiva
        cena={cur}
        dados={data}
        direcao={dir}
        coreografia={choreography}
        temMusica={hasMusic}
        ultimo={isLast}
        outroSemestre={otherSemester}
        classeAcaoSecundaria={secondaryAction}
        gravando={recording}
        progressoGravacao={recPct}
        compartilhando={sharing}
        aoGerarVideo={makeVideo}
        aoCompartilhar={share}
        aoReiniciar={() => setI(0)}
      />

      {recording && (
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+3.5rem)] z-20 px-10">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${recPct}%` }} />
          </div>
          <p className={cn("mt-2 text-center text-xs", editorialDark ? "text-white/80" : "text-[#302c27]/75")}>Montando o filme de vocês…</p>
        </div>
      )}

      <SeletorMusica
        aberto={showSpotifyInput}
        editandoCena={editingSlide}
        chaveCena={curSlideKey}
        musicaCena={curSlideSong}
        sugestaoIa={aiSong}
        consulta={query}
        resultados={results}
        buscando={searching}
        erro={searchError}
        musicaPadraoId={spotifyId}
        aoAlterarEdicao={setEditingSlide}
        aoAlterarConsulta={onQueryChange}
        aoRemoverMusicaCena={deleteSlideMusic}
        aoSalvarMusicaCena={saveSlideMusic}
        aoSelecionarFaixa={selectTrack}
        aoFechar={() => setShowSpotifyInput(false)}
        aoRemoverMusicaPadrao={disconnectSpotify}
      />

      {/* Spotify embed */}
      {(() => {
        const active = curSlideSong ?? defaultSong;
        const trackId = active?.trackId ?? spotifyId;
        const label = active ? `${active.trackName} — ${active.artist}` : spotifyName;
        if (!trackId || showSpotifyInput) return null;
        return (
          <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] z-30 flex flex-col items-center gap-1">
            <iframe
              title="Spotify"
              src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
              width="90%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="max-w-md rounded-xl shadow-2xl"
            />
            <p className="text-[10px] text-white/40">{active ? `${active.trackName} — ${active.artist}` : label}</p>
          </div>
        );
      })()}

      <div
        className="retro-editorial-hint absolute inset-x-0 z-20 text-center text-xs text-white/70"
        style={{ bottom: (curSlideSong ?? defaultSong ?? spotifyId) ? "calc(env(safe-area-inset-bottom) + 7rem)" : "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        {isLast ? "Enlace" : "toque para avançar"}
      </div>
    </div>
  );
}

export type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "./retrospectiva/tipos";
export { criarCenas } from "./retrospectiva/criar-cenas";
