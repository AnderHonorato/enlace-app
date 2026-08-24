"use client";

import { Loader2, MapPin, Mic } from "lucide-react";
import { decodeEntities, looksLikeHtml } from "@/nucleo/sanitizacao";
import type { EntryDTO } from "@/nucleo/memorias";
import { PhotoCarousel } from "../CarrosselFotos";
import { VoiceNotePlayer } from "../ReprodutorAudio";
import { openLightbox } from "../VisualizadorMidia";

type PropriedadesConteudoMemoria = {
  memoria: EntryDTO;
  lugarResolvido: string | null;
  podeInteragir: boolean;
  transcrevendoId: string | null;
  aoTranscrever: (id: string) => void;
};

export function ConteudoMemoria({
  memoria,
  lugarResolvido,
  podeInteragir,
  transcrevendoId,
  aoTranscrever,
}: PropriedadesConteudoMemoria) {
  const imagens = memoria.attachments.filter((anexo) => anexo.type === "image");
  const audios = memoria.attachments.filter((anexo) => anexo.type === "audio");
  const videos = memoria.attachments.filter((anexo) => anexo.type === "video");
  const enderecosImagens = imagens.map((anexo) => anexo.url);

  return (
    <>
      <div className="px-5 pb-3.5">
        {memoria.title && <h3 className="display mb-1.5 text-2xl text-text sm:text-[29px]">{memoria.title}</h3>}
        {memoria.content && (looksLikeHtml(memoria.content) ? (
          <div className="rich max-w-[62ch] text-[14.5px] leading-[1.72] text-muted" dangerouslySetInnerHTML={{ __html: memoria.content }} />
        ) : (
          <p className="prose-amora max-w-[62ch] text-[14.5px] leading-[1.72] text-muted">{decodeEntities(memoria.content)}</p>
        ))}
        {(memoria.tags.length > 0 || memoria.place || (memoria.lat != null && memoria.lng != null)) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {(memoria.place || (memoria.lat != null && memoria.lng != null)) && (
              <span className="tag tag-off"><MapPin size={11} className="text-accent" /> {memoria.place ?? lugarResolvido ?? "Localização adicionada"}</span>
            )}
            {memoria.tags.map((etiqueta) => <span key={etiqueta} className="tag">#{etiqueta}</span>)}
          </div>
        )}
      </div>

      {memoria.attachments.length > 0 && (
        <div className="space-y-2 px-5 pb-3">
          {imagens.length > 0 && (
            <PhotoCarousel
              photos={imagens.map((anexo) => ({ url: anexo.url, caption: anexo.caption }))}
              onOpen={(indice) => openLightbox(enderecosImagens, indice)}
            />
          )}
          {videos.map((anexo) => (
            <div key={anexo.id} className="overflow-hidden rounded-xl border border-border">
              <video src={anexo.url} controls preload="none" className="max-h-[420px] w-full bg-black" />
              {anexo.caption && <div className="bg-surface2/60 px-3 py-1.5 text-sm text-muted">{anexo.caption}</div>}
            </div>
          ))}
          {audios.map((anexo) => (
            <div key={anexo.id} className="space-y-2">
              <VoiceNotePlayer src={anexo.url} duration={anexo.duration} />
              {anexo.transcript ? (
                <div className="rounded-xl border border-accent/15 bg-accent/[0.05] px-3 py-2 text-sm text-muted">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accentInk">Transcrição</div>
                  {anexo.transcript}
                </div>
              ) : podeInteragir ? (
                <button
                  type="button"
                  onClick={() => aoTranscrever(anexo.id)}
                  disabled={transcrevendoId === anexo.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5 text-xs font-semibold text-accentInk disabled:opacity-60"
                >
                  {transcrevendoId === anexo.id ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />}
                  {transcrevendoId === anexo.id ? "Transcrevendo…" : "Transcrever áudio?"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
