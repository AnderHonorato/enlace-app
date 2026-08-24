"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Falha de rota no Enlace", error.digest || error.message);
  }, [error]);

  return (
    <section role="alert" className="card mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertCircle size={26} />
      </span>
      <h1 className="display text-3xl text-text">Esta página não abriu</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Seus dados continuam seguros. Tente carregar novamente ou volte para a linha do tempo.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-text px-4 text-sm font-semibold text-bg transition hover:bg-accent">
          <RefreshCw size={16} /> Tentar novamente
        </button>
        <Link href="/app" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted transition hover:bg-surface2 hover:text-text">
          <Home size={16} /> Ir para o início
        </Link>
      </div>
    </section>
  );
}
