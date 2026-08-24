"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: Kind };

let seq = 1;
const listeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, kind: Kind = "info") {
  const t: Toast = { id: seq++, message, kind };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3600);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full border border-border2 bg-surface px-4 py-2.5 text-sm shadow-card"
          >
            <span
              className={
                t.kind === "success"
                  ? "text-success"
                  : t.kind === "error"
                  ? "text-danger"
                  : "text-accent"
              }
            >
              {t.kind === "success" ? <Check size={16} /> : t.kind === "error" ? <X size={16} /> : <Info size={16} />}
            </span>
            <span className="text-text">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
