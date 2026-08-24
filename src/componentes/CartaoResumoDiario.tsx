"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Share2, RefreshCw, History, Loader2, Link2 } from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { AiMark } from "./Papelaria";
import { SummaryView, shareSummaryImage, type Summary } from "./CartaoResumo";

export function DailySummaryCard({
  initialToday,
  coupled,
  names,
}: {
  initialToday: Summary | null;
  coupled: boolean;
  names: string;
}) {
  const [today, setToday] = useState<Summary | null>(initialToday);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!coupled) {
    return (
      <Link
        href="/app/config"
        className="scrap-frame scrap-frame-botanical mb-5 flex items-center gap-3 rounded-3xl border border-accent/30 bg-accent/8 p-4 transition hover:bg-accent/12"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <AiMark size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text">Resumo do amor</div>
          <div className="text-sm text-muted">Conecte-se com seu amor para receber o resumo diário de vocês.</div>
        </div>
        <Link2 size={18} className="text-accent" />
      </Link>
    );
  }

  async function generate(period: "day" | "week" | "month" = "day") {
    setBusy(true);
    try {
      const res = await api<{ summary: Summary; source?: "ai" | "offline" }>("/api/resumo", {
        method: "POST",
        body: JSON.stringify({ period }),
      });
      setToday(res.summary);
      if (res.source === "offline") {
        // Sem isso o usuário clica "gerar" várias vezes sem entender
        // por que o texto quase não muda.
        toast("Resumo gerado sem IA. Configure sua chave em Você → IA para textos personalizados.", "info");
      } else {
        toast(
          period === "day"
            ? "Resumo do amor pronto ✦"
            : period === "week"
            ? "Resumo da semana pronto ✦"
            : "Resumo do mês pronto ✦",
          "success"
        );
      }
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!today) return;
    setSharing(true);
    try {
      await shareSummaryImage(today, names);
    } catch {
      toast("Não consegui gerar a imagem.", "error");
    } finally {
      setSharing(false);
    }
  }

  if (!today) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="scrap-frame scrap-frame-tape mb-5 overflow-hidden rounded-3xl border border-border bg-surface p-5"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <AiMark size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl text-text">Resumo do amor de hoje</div>
            <div className="text-sm text-muted">A IA lê as memórias recentes de vocês e conta como o amor anda.</div>
          </div>
        </div>
        <button
          onClick={() => generate("day")}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl accent-gradient py-3 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
          Gerar resumo de hoje
        </button>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => generate("week")}
            disabled={busy}
            className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-70"
          >
            Da semana
          </button>
          <button
            onClick={() => generate("month")}
            disabled={busy}
            className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-70"
          >
            Do mês
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      {/* A key faz o texto novo entrar animado — dá a sensação de "resumo fresco". */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${today.id}-${today.title}`}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <SummaryView summary={today} names={names} />
        </motion.div>
      </AnimatePresence>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={share}
          disabled={sharing}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text transition hover:bg-surface2 disabled:opacity-70"
        >
          {sharing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />} Compartilhar
        </button>
        <button
          onClick={() => generate("day")}
          disabled={busy}
          title="Atualizar"
          className="flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2.5 text-muted transition hover:bg-surface2 disabled:opacity-70"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>
        <button
          onClick={() => generate("week")}
          disabled={busy}
          title="Resumo da semana"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-muted transition hover:bg-surface2 disabled:opacity-70"
        >
          Semana
        </button>
        <Link
          href="/app/resumos"
          title="Histórico"
          className="flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2.5 text-muted transition hover:bg-surface2"
        >
          <History size={15} />
        </Link>
      </div>
    </motion.div>
  );
}
