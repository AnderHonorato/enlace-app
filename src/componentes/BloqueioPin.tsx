"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Delete, Loader2, LockKeyhole } from "lucide-react";
import { HeartMark } from "./Logo";
import { api } from "@/nucleo/cliente";

const SESSION_KEY = "enlace-desbloqueado";

/** Tela de PIN — cobre o app até o usuário digitar o código. */
export function PinLock({ enabled }: { enabled: boolean }) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const checking = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    // Desbloqueado nesta aba? (sessionStorage some ao fechar o app)
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {}
    setLocked(true);
  }, [enabled]);

  async function submit(code: string) {
    if (checking.current) return;
    checking.current = true;
    setBusy(true);
    try {
      await api("/api/security/pin", { method: "PUT", body: JSON.stringify({ pin: code }) });
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      setLocked(false);
    } catch {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 600);
    } finally {
      setBusy(false);
      checking.current = false;
    }
  }

  function press(d: string) {
    if (busy) return;
    const next = (pin + d).slice(0, 8);
    setPin(next);
    if (next.length >= 4) {
      // tenta a partir de 4 dígitos
      submit(next);
    }
  }

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[140] flex flex-col items-center justify-center bg-bg px-8">
      <div className="ambient-bg" aria-hidden />
      <HeartMark size={44} />
      <h1 className="mt-4 font-display text-3xl text-text">Enlace trancado</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
        <LockKeyhole size={14} /> Digite seu PIN para entrar
      </p>

      <motion.div
        animate={error ? { x: [0, -10, 10, -8, 8, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="mt-7 flex gap-2.5"
      >
        {Array.from({ length: Math.max(4, pin.length || 4) }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition ${
              error ? "bg-danger" : i < pin.length ? "bg-accent" : "bg-surface2"
            }`}
          />
        ))}
      </motion.div>

      <div className="mt-8 grid w-full max-w-[260px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadButton key={d} onClick={() => press(d)}>
            {d}
          </PadButton>
        ))}
        <span />
        <PadButton onClick={() => press("0")}>0</PadButton>
        <PadButton onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Apagar">
          <Delete size={20} />
        </PadButton>
      </div>

      {busy && <Loader2 size={20} className="mt-6 animate-spin text-accent" />}
    </div>
  );
}

function PadButton({ children, onClick, ...rest }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      {...rest}
      className="flex h-16 items-center justify-center rounded-2xl border border-border bg-surface text-2xl font-medium text-text transition hover:bg-surface2"
    >
      {children}
    </motion.button>
  );
}
