"use client";

import { useEffect, useRef, useState } from "react";
import { Mic2, Pause, Play, Volume2 } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";

type Props = {
  src: string;
  duration?: number | null;
  className?: string;
};

const ACTIVE_EVENT = "enlace:voice-note-play";

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function VoiceNotePlayer({ src, duration: initialDuration, className }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);

  useEffect(() => {
    const pauseOther = (event: Event) => {
      if ((event as CustomEvent<string>).detail === src) return;
      audioRef.current?.pause();
      setPlaying(false);
    };
    window.addEventListener(ACTIVE_EVENT, pauseOther);
    return () => window.removeEventListener(ACTIVE_EVENT, pauseOther);
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: src }));
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className={cn("relative flex items-center gap-3 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-surface2/70 to-accent2/10 px-3 py-2.5", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/5 to-transparent" />
      <button type="button" onClick={toggle} className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-glow transition hover:scale-105 hover:brightness-110 active:scale-95" aria-label={playing ? "Pausar nota de voz" : "Tocar nota de voz"}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="translate-x-px" fill="currentColor" />}
      </button>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accentInk"><Mic2 size={12} /> Nota de voz</span>
          <span className="text-[10px] font-medium tabular-nums text-muted">{formatTime(current)} / {formatTime(duration)}</span>
        </div>
        <div className="relative h-5">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-1 opacity-60">
            {[3, 7, 12, 6, 15, 9, 13, 5, 10, 16, 8, 12, 6, 14, 4, 9].map((height, index) => <span key={index} className={cn("w-1 rounded-full bg-accent", playing && "animate-pulse")} style={{ height: `${height}px`, animationDelay: `${index * 45}ms` }} />)}
          </div>
          <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => seek(Number(event.target.value))} disabled={!duration} aria-label="Progresso da nota de voz" className="voice-progress relative z-10 w-full" />
        </div>
      </div>
      <Volume2 size={16} className="relative z-10 shrink-0 text-muted" aria-hidden="true" />
      <audio ref={audioRef} src={src} preload="none" className="sr-only" onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : initialDuration ?? 0)} onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCurrent(0); }} />
    </div>
  );
}
