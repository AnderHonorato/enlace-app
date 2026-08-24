"use client";

import { Mic, X } from "lucide-react";
import type { AnexoRascunho } from "./tipos";

type PropriedadesGaleriaAnexos = {
  imagens: AnexoRascunho[];
  videos: AnexoRascunho[];
  audios: AnexoRascunho[];
  aoRemover: (url: string) => void;
  aoAlterarLegenda: (url: string, legenda: string) => void;
};

export function GaleriaAnexos({ imagens, videos, audios, aoRemover, aoAlterarLegenda }: PropriedadesGaleriaAnexos) {
  return (
    <>
      {imagens.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {imagens.map((anexo) => (
            <div key={anexo.url} className="group relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={anexo.url} alt="" decoding="async" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => aoRemover(anexo.url)}
                aria-label="Remover foto"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X size={13} />
              </button>
              <input
                value={anexo.caption ?? ""}
                onChange={(evento) => aoAlterarLegenda(anexo.url, evento.target.value)}
                placeholder="legenda…"
                maxLength={200}
                className="w-full border-t border-border bg-bg2 px-2 py-1.5 text-xs text-text placeholder:text-faint focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-3 space-y-2">
          {videos.map((anexo) => (
            <div key={anexo.url} className="relative overflow-hidden rounded-xl border border-border">
              <video src={anexo.url} controls preload="none" className="max-h-64 w-full bg-black" />
              <button
                type="button"
                onClick={() => aoRemover(anexo.url)}
                aria-label="Remover vídeo"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {audios.length > 0 && (
        <div className="mt-3 space-y-2">
          {audios.map((anexo) => (
            <div key={anexo.url} className="flex items-center gap-2 rounded-xl border border-border bg-surface2/50 p-2">
              <Mic size={16} className="shrink-0 text-accent" />
              <audio src={anexo.url} controls preload="none" className="h-9 flex-1" />
              <button type="button" onClick={() => aoRemover(anexo.url)} aria-label="Remover áudio" className="shrink-0 text-faint hover:text-danger">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
