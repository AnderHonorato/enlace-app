"use client";
import { criarCenas } from "@/componentes/retrospectiva/criar-cenas";
import { carregarImagem } from "@/componentes/retrospectiva/compartilhar-imagem";
import type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "@/componentes/retrospectiva/tipos";
import { constellationOf, moonPhase, seasonOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";


import { desenharSlide } from "./video-retrospectiva/desenhar-slide";
import { H, W } from "./video-retrospectiva/utilitarios-canvas";

export function gravacaoVideoSuportada(): boolean {
  if (typeof window === "undefined") return false;
  const canRecord = "MediaRecorder" in window;
  const canStream = typeof (document.createElement("canvas") as any).captureStream === "function";
  return canRecord && canStream;
}

function escolherMime(): string {
  const opts = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const m of opts) {
    try {
      if ((window as any).MediaRecorder.isTypeSupported(m)) return m;
    } catch {}
  }
  return "video/webm";
}

const SEGUNDOS_POR_CENA = 2.9; // segundos por tela

/** Grava a retrospectiva como vídeo (webm) desenhando os slides num canvas. */
export async function gravarVideoRetrospectiva(
  data: DadosRetrospectiva,
  onProgress?: (p: number) => void,
  songLabel?: string,
  semester?: number,
): Promise<Blob> {
  const slides = criarCenas(data, semester, undefined, undefined, Date.now());

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Pré-carrega todas as imagens — inclusive as das cenas novas, que não
  // ficam em `slide.photos` e sim penduradas no `data`.
  const urls = new Set<string>();
  for (const s of slides) {
    if (s.photo) urls.add(s.photo);
    s.photos?.forEach((p) => urls.add(p.url));
  }
  data.timeline?.forEach((t) => t.photo && urls.add(t.photo));
  data.placeList?.forEach((p) => p.photo && urls.add(p.photo));
  if (data.firstEntry?.photo) urls.add(data.firstEntry.photo);
  const imgs = new Map<string, HTMLImageElement>();
  await Promise.all(
    [...urls].map(async (u) => {
      try {
        imgs.set(u, await carregarImagem(u));
      } catch {}
    })
  );

  const fps = 30;
  const total = slides.length * SEGUNDOS_POR_CENA;
  const videoStream = (canvas as any).captureStream(fps) as MediaStream;

  // Trilha de áudio silenciosa.
  //
  // A versão anterior chamava getUserMedia({audio:true}) "para capturar o som
  // do sistema" — mas isso captura o MICROFONE: pedia permissão e gravava a
  // conversa de quem estava na sala dentro do vídeo do casal. Nunca capturou
  // som do sistema (navegador não permite isso por getUserMedia).
  // Uma trilha muda mantém o container válido sem invadir nada.
  let audioStream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(dest);
    osc.start();
    audioStream = dest.stream;
  } catch {}

  // Junta video + audio
  const combined = audioStream
    ? new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()])
    : videoStream;

  const mime = escolherMime();
  const rec = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  const finished = new Promise<Blob>((res) => {
    rec.onstop = () => res(new Blob(chunks, { type: mime }));
  });

  desenharSlide(ctx, slides[0], 0, imgs, songLabel, data);
  rec.start();

  const start = performance.now();
  await new Promise<void>((resolve) => {
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= total) {
        resolve();
        return;
      }
      const idx = Math.min(slides.length - 1, Math.floor(t / SEGUNDOS_POR_CENA));
      const local = (t - idx * SEGUNDOS_POR_CENA) / SEGUNDOS_POR_CENA;
      desenharSlide(ctx, slides[idx], local, imgs, songLabel, data);
      onProgress?.(t / total);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  rec.stop();
  // Libera a trilha silenciosa e o contexto de áudio.
  audioStream?.getAudioTracks().forEach((t) => t.stop());
  audioCtx?.close().catch(() => {});
  onProgress?.(1);
  return finished;
}
