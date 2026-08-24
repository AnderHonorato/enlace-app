"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Heart } from "lucide-react";

type Options = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  input?: boolean;
  inputPlaceholder?: string;
  inputType?: string;
};

type Pending = Options & { id: number; resolve: (v: any) => void };

let seq = 1;
let listener: ((p: Pending | null) => void) | null = null;

export function confirmDialog(opts: Options): Promise<string | boolean> {
  return new Promise((resolve) => {
    const p: Pending = { ...opts, id: seq++, resolve };
    listener?.(p);
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listener = setPending;
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (pending?.input) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pending]);

  function close(result: any) {
    pending?.resolve(result);
    setPending(null);
  }

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(pending.input ? "" : false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-5"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => close(pending.input ? "" : false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="card relative w-full max-w-sm p-6 text-center"
          >
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                pending.danger ? "bg-danger/12 text-danger" : "bg-accent/12 text-accent"
              }`}
            >
              {pending.danger ? <AlertTriangle size={26} /> : <Heart size={26} />}
            </div>
            <h3 className="font-display text-2xl text-text">{pending.title}</h3>
            {pending.message && <p className="mt-2 text-sm leading-relaxed text-muted">{pending.message}</p>}

            {pending.input && (
              <div className="mt-4">
                <input
                  ref={inputRef}
                  type={pending.inputType || "text"}
                  placeholder={pending.inputPlaceholder}
                  className="w-full rounded-xl border border-border bg-bg2 px-3 py-2.5 text-sm text-text placeholder:text-faint outline-none focus:border-accent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") close((e.target as HTMLInputElement).value);
                  }}
                />
              </div>
            )}

            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => close(pending.input ? "" : false)}
                className="flex-1 rounded-xl border border-border bg-surface2 py-2.5 font-medium text-text transition hover:bg-surface2/70"
              >
                {pending.cancelLabel || "Cancelar"}
              </button>
              <button
                onClick={() => close(pending.input ? inputRef.current?.value || "" : true)}
                className={`flex-1 rounded-xl py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 ${
                  pending.danger ? "bg-danger" : "accent-gradient"
                }`}
              >
                {pending.confirmLabel || "Confirmar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
