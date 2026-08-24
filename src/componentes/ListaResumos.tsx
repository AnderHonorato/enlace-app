"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Loader2, Sparkles } from "lucide-react";
import { SummaryView, shareSummaryImage, type Summary } from "./CartaoResumo";
import { toast } from "./Avisos";

export function ResumosList({ summaries, names }: { summaries: Summary[]; names: string }) {
  const [sharingId, setSharingId] = useState<string | null>(null);

  async function share(s: Summary) {
    setSharingId(s.id);
    try {
      await shareSummaryImage(s, names);
    } catch {
      toast("Não consegui gerar a imagem.", "error");
    } finally {
      setSharingId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="kicker mb-1">Retratos do dia a dia</div>
          <h1 className="font-display text-3xl text-text">Resumos do amor</h1>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <Sparkles size={26} />
          </div>
          <h2 className="font-display text-2xl text-text">Ainda não há resumos</h2>
          <p className="mt-1 max-w-xs text-muted">
            Gere o resumo de hoje na tela inicial. A cada dia, um novo retrato do amor de vocês fica guardado aqui.
          </p>
          <Link href="/app" className="mt-5 rounded-full accent-gradient px-5 py-2.5 font-semibold text-white shadow-glow">
            Voltar ao início
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((s) => (
            <div key={s.id}>
              <SummaryView summary={s} names={names} />
              <button
                onClick={() => share(s)}
                disabled={sharingId === s.id}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text transition hover:bg-surface2 disabled:opacity-70"
              >
                {sharingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />} Compartilhar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
