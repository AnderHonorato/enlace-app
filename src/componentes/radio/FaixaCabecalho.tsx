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


import { usarRadio } from "./ContextoRadio";

export function FaixaRadioCabecalho({ me: _me, variant = "desktop" }: { me: Me; variant?: "desktop" | "mobile" }) {
  const { current, isPlaying, pause } = usarRadio();
  const [dismissedFaixaId, setDismissedFaixaId] = useState<string | null>(null);
  useEffect(() => { setDismissedFaixaId(null); }, [current?.trackId]);

  // O cabeçalho reflete o elemento de áudio deste aparelho. Uma faixa apenas
  // selecionada ou pausada não ocupa espaço e não dispara nenhuma consulta.
  if (!current || !isPlaying || dismissedFaixaId === current.trackId) return null;

  function pausar(e: React.MouseEvent) {
    e.preventDefault();
    pause();
  }

  if (variant === "mobile") {
    return (
      <button
        onClick={pausar}
        title={`${current.trackName} — toque para pausar`}
        aria-label={`Pausar ${current.trackName}, de ${current.artist}`}
        className="focus-ring relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border2 bg-surface"
      >
        <CapaRadio url={current.image} size={34} />
        <span className="absolute inset-0 grid place-items-center bg-bg/35 text-white">
          <EqualizadorMini />
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex min-w-0 items-center gap-2 rounded-lg border border-border2 bg-surface py-1 pl-1.5 pr-1 transition-colors hover:border-accent/40",
        "max-w-[240px]"
      )}
    >
      <Link
        href="/app/radio"
        aria-label={`Abrir a rádio — tocando ${current.trackName}, de ${current.artist}`}
        className="focus-ring absolute inset-0 rounded-lg"
      />
      <span className="pointer-events-none shrink-0">
        <CapaRadio url={current.image} size={30} />
      </span>
      <span className="pointer-events-none min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="kicker kicker-sm truncate">Tocando agora</span>
          <EqualizadorMini />
        </span>
        <span className="block truncate text-[12px] font-semibold leading-tight text-text">
          {current.trackName}
          <span className="font-normal text-muted"> — {current.artist}</span>
        </span>
      </span>
      <button
        onClick={pausar}
        title="Pausar"
        aria-label="Pausar minha reprodução"
        className="focus-ring relative z-10 shrink-0 rounded-md p-1.5 text-faint transition hover:bg-surface2 hover:text-accent"
      >
        <Pause size={14} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); setDismissedFaixaId(current.trackId); }}
        title="Ocultar"
        aria-label="Ocultar faixa compartilhada"
        className="focus-ring relative z-10 shrink-0 rounded-md p-1.5 text-faint transition hover:bg-surface2 hover:text-text"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Equalizador da tira do cabeçalho — CSS puro (transform), sem JS por frame. */
function EqualizadorMini() {
  return (
    <span className="radio-eq" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function CapaRadio({ url, size }: { url: string | null; size: number }) {
  if (!url) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
        style={{ width: size, height: size }}
      >
        <Music size={size * 0.4} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />
  );
}

export function BarrasAudio({ reduced }: { reduced: boolean }) {
  return (
    <span className="flex items-end gap-0.5" style={{ height: 14 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-white"
          animate={reduced ? { height: 8 } : { height: [4, 13, 6, 11, 4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          style={{ height: 6 }}
        />
      ))}
    </span>
  );
}
