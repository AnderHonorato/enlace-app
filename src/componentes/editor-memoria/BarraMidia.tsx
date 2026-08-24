"use client";

import { useRef } from "react";
import { Calendar, ImagePlus, Loader2, Lock, Users, Video } from "lucide-react";
import { VoiceRecorder } from "../GravadorAudio";
import type { AnexoRascunho } from "./tipos";

type PropriedadesBarraMidia = {
  data: string;
  casalConectado: boolean;
  visibilidade: "shared" | "private";
  enviandoImagens: boolean;
  enviandoVideo: boolean;
  limiteAtingido: boolean;
  aoAlterarData: (data: string) => void;
  aoAlternarVisibilidade: () => void;
  aoSelecionarImagens: (arquivos: FileList | null) => void;
  aoSelecionarVideo: (arquivos: FileList | null) => void;
  aoAlterarGravacao: (ocupado: boolean) => void;
  aoGravarAudio: (audio: { url: string; duration: number }) => void;
};

export function BarraMidia({
  data,
  casalConectado,
  visibilidade,
  enviandoImagens,
  enviandoVideo,
  limiteAtingido,
  aoAlterarData,
  aoAlternarVisibilidade,
  aoSelecionarImagens,
  aoSelecionarVideo,
  aoAlterarGravacao,
  aoGravarAudio,
}: PropriedadesBarraMidia) {
  const arquivoImagem = useRef<HTMLInputElement>(null);
  const arquivoVideo = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
        <Calendar size={16} className="text-accent" />
        <input type="date" value={data} onChange={(evento) => aoAlterarData(evento.target.value)} className="bg-transparent text-text focus:outline-none" />
      </label>

      {casalConectado && (
        <button onClick={aoAlternarVisibilidade} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface2">
          {visibilidade === "shared" ? <><Users size={16} className="text-accent" /> Compartilhado</> : <><Lock size={16} /> Só eu</>}
        </button>
      )}

      <input ref={arquivoImagem} type="file" accept="image/*" multiple hidden onChange={(evento) => aoSelecionarImagens(evento.target.files)} />
      <button
        type="button"
        onClick={() => arquivoImagem.current?.click()}
        disabled={enviandoImagens}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-60"
      >
        {enviandoImagens ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} className="text-accent" />}
        {enviandoImagens ? "Enviando…" : "Foto"}
      </button>

      <input ref={arquivoVideo} type="file" accept="video/*" hidden onChange={(evento) => aoSelecionarVideo(evento.target.files)} />
      <button
        type="button"
        onClick={() => arquivoVideo.current?.click()}
        disabled={enviandoVideo}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-60"
      >
        {enviandoVideo ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} className="text-accent" />} Vídeo
      </button>

      <VoiceRecorder disabled={limiteAtingido} onBusyChange={aoAlterarGravacao} onRecorded={aoGravarAudio} />
    </div>
  );
}
