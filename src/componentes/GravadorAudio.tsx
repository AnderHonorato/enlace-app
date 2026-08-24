"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Loader2, X, AlertTriangle } from "lucide-react";
import { startAudioRecording, uploadMedia, fmtDuration, audioRecordingSupported, checkMicPermission, type Recorder } from "@/nucleo/midia-cliente";
import { toast } from "./Avisos";
import { isSecureBrowserContext } from "@/nucleo/midia-cliente";

/** Grava uma nota de voz, envia e devolve a URL + duração. */
export function VoiceRecorder({
  onRecorded,
  disabled,
  onBusyChange,
}: {
  onRecorded: (a: { url: string; duration: number }) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const recRef = useRef<Recorder | null>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    onBusyChange?.(recording || uploading);
    return () => onBusyChange?.(false);
  }, [onBusyChange, recording, uploading]);

  useEffect(() => {
    checkMicPermission().then((state) => setMicDenied(state === "denied"));
    return () => {
      if (timer.current) clearInterval(timer.current);
      recRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    if (!isSecureBrowserContext()) {
      toast("O microfone precisa de HTTPS. Abra o site pelo endereço que começa com https://.", "error");
      return;
    }
    if (!audioRecordingSupported()) {
      toast("Seu navegador não permite gravar áudio.", "error");
      return;
    }
    try {
      recRef.current = await startAudioRecording();
      setRecording(true);
      setElapsed(0);
      setMicDenied(false);
      timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err: any) {
      const isDenied = err?.name === "NotAllowedError" || err?.message?.includes("Permission");
      if (isDenied) {
        setMicDenied(true);
        toast(
          "Permissão do microfone negada. Libere nas configurações do navegador e tente novamente.",
          "error"
        );
      } else if (err?.name === "NotFoundError" || err?.message?.includes("device")) {
        toast("Nenhum microfone encontrado.", "error");
      } else {
        toast("Não consegui acessar o microfone.", "error");
      }
    }
  }

  async function finish(save: boolean) {
    if (!recRef.current) return;
    if (timer.current) clearInterval(timer.current);
    const { blob, seconds } = await recRef.current.stop();
    recRef.current = null;
    setRecording(false);
    if (!save || seconds < 0.6) return;
    setUploading(true);
    try {
      const { url } = await uploadMedia(blob, "nota-de-voz.webm");
      onRecorded({ url, duration: Math.round(seconds) });
    } catch (err: any) {
      toast(err.message || "Falha ao enviar o áudio.", "error");
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Enviando áudio…
      </span>
    );
  }

  if (recording) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/8 px-3 py-2 text-sm">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="h-2.5 w-2.5 rounded-full bg-danger"
        />
        <span className="font-mono text-danger">{fmtDuration(elapsed)}</span>
        <button type="button" onClick={() => finish(true)} title="Concluir" className="text-success hover:opacity-80">
          <Square size={16} className="fill-current" />
        </button>
        <button type="button" onClick={() => finish(false)} title="Descartar" className="text-faint hover:text-danger">
          <X size={16} />
        </button>
      </span>
    );
  }

  if (micDenied) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/8 px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/12 disabled:opacity-50"
        title="Permissão do microfone negada — toque para tentar novamente"
      >
        <AlertTriangle size={16} /> Microfone bloqueado
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-50"
    >
      <Mic size={16} className="text-accent" /> Nota de voz
    </button>
  );
}
