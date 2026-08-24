"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, X, Download, Share2 } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";

export function QrShare({ url, title }: { url: string; title?: string }) {
  const [aberto, setAberto] = useState(false);

  const qrUrl = `/api/qr?data=${encodeURIComponent(url)}`;

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Enlace", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-full p-2 text-muted transition hover:text-accent"
        title="Compartilhar via QR Code"
      >
        <QrCode size={18} />
      </button>

      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setAberto(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-xs rounded-3xl bg-surface p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAberto(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg text-text">QR Code</h3>
            <p className="text-xs text-muted">{title || "Escaneie para abrir"}</p>

            <div className="my-4 flex justify-center rounded-2xl bg-white p-3">
              <img src={qrUrl} alt="QR Code" className="h-48 w-48" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={compartilhar}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Share2 size={15} /> Compartilhar
              </button>
              <a
                href={qrUrl}
                download="enlace-qrcode.svg"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text transition hover:bg-surface2"
              >
                <Download size={15} />
              </a>
            </div>

            <p className="mt-3 text-[11px] text-faint">
              Imprima e entregue junto com um cartão ou carta.
            </p>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
