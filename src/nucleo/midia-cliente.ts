"use client";

export function isSecureBrowserContext(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;
  const { protocol, hostname } = window.location;
  return protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export async function uploadMedia(file: File | Blob, filename?: string): Promise<{ url: string; type: string }> {
  const fd = new FormData();
  const f = file instanceof File ? file : new File([file], filename || "media", { type: (file as Blob).type || "audio/webm" });
  fd.append("file", f);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Falha no envio.");
  return data as { url: string; type: string };
}

export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function audioRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    "MediaRecorder" in window
  );
}

export type MicPermission = "granted" | "denied" | "prompt" | "unsupported";

export async function checkMicPermission(): Promise<MicPermission> {
  if (!audioRecordingSupported()) return "unsupported";
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return result.state as MicPermission;
    } catch {
      // Permissions API não suporta "microphone" em alguns navegadores (Firefox, Safari)
    }
  }
  // Sem a Permissions API não dá para saber o estado sem pedir o microfone —
  // e pedir aqui abriria o aviso do navegador só por abrir a tela, sem o usuário
  // ter clicado em nada. Então assumimos "prompt": a permissão só é pedida de
  // verdade quando a pessoa aperta gravar.
  return "prompt";
}

function audioMime(): string {
  const opts = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];
  for (const m of opts) {
    try {
      if ((window as any).MediaRecorder.isTypeSupported(m)) return m;
    } catch {}
  }
  return "";
}

export type Recorder = {
  stream: MediaStream;
  rec: MediaRecorder;
  stop: () => Promise<{ blob: Blob; seconds: number }>;
};

/** Começa a gravar áudio do microfone. Chame stop() para obter o arquivo. */
export async function startAudioRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = audioMime();
  let rec: MediaRecorder;
  try {
    rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  } catch {
    rec = new MediaRecorder(stream);
  }
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const started = performance.now();
  // timeslice de 1s garante que ondataavailable é chamado em navegadores que exigem
  rec.start(1000);

  const stop = () =>
    new Promise<{ blob: Blob; seconds: number }>((resolve) => {
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        // usa mimeType real do navegador, fallback para o que foi negociado
        const blobType = rec.mimeType || mime || chunks[0] && (chunks[0] as Blob).type || "audio/webm";
        resolve({ blob: new Blob(chunks, { type: blobType }), seconds: (performance.now() - started) / 1000 });
      };
      // Safari pode não ter dados se parar muito rápido; o onstop vai pegar o que tiver
      if (rec.state !== "inactive") rec.stop();
      else rec.dispatchEvent(new Event("stop"));
    });

  return { stream, rec, stop };
}
