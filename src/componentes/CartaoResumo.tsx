"use client";
import { fmtDate } from "@/nucleo/utilitarios";
import { IconBrilho } from "./Icones";
import { AiMark } from "./Papelaria";

export type Summary = {
  id: string;
  day: string;
  period?: "day" | "week" | "month";
  vibe: "positive" | "neutral" | "attention";
  title: string;
  message: string;
  tip: string | null;
  createdAt: string;
};

export const PERIOD_BADGE: Record<string, string> = {
  day: "Hoje",
  week: "Semana",
  month: "Mês",
};

export const VIBES = {
  positive: { grad: ["#E5679B", "#9575E8"], emoji: "💞", label: "Vocês estão indo bem" },
  neutral: { grad: ["#6366C9", "#8B5CD6"], emoji: "🌙", label: "No ritmo de vocês" },
  attention: { grad: ["#F0883E", "#E5679B"], emoji: "🫶", label: "Vale um carinho a mais" },
} as const;

function dayToDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Card do resumo diário, no clima de um "story". */
export function SummaryView({ summary, names }: { summary: Summary; names: string }) {
  const v = VIBES[summary.vibe] ?? VIBES.neutral;
  return (
    <div
      className="scrap-frame scrap-frame-botanical relative overflow-hidden rounded-3xl p-6 text-white shadow-lift"
      style={{ background: `linear-gradient(140deg, ${v.grad[0]}, ${v.grad[1]})` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between text-xs font-medium text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <AiMark size={12} />
            Resumo do amor
            {summary.period && summary.period !== "day" && (
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5">{PERIOD_BADGE[summary.period]}</span>
            )}
          </span>
          <span>{fmtDate(dayToDate(summary.day))}</span>
        </div>

        <div className="mt-5 text-5xl">{v.emoji}</div>
        <h3 className="mt-2 font-display text-3xl leading-tight">{summary.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-white/90">{summary.message}</p>

        {summary.tip && (
          <div className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-white/15 px-3.5 py-2.5 text-sm backdrop-blur">
            <span className="text-warning"><IconBrilho size={14} /></span>
            <span className="text-white/95">{summary.tip}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-xs text-white/75">
          <span className="font-semibold tracking-wide">Enlace</span>
          <span>{names}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Exportação da imagem (formato story 1080x1920) ----

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function shareSummaryImage(summary: Summary, names: string) {
  const v = VIBES[summary.vibe] ?? VIBES.neutral;
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, v.grad[0]);
  g.addColorStop(1, v.grad[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // brilhos
  const glow = (x: number, y: number, r: number, c: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  glow(880, 240, 420, "rgba(255,255,255,0.25)");
  glow(180, 1680, 420, "rgba(0,0,0,0.12)");

  ctx.textBaseline = "top";
  const pad = 110;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 34px Georgia, serif";
  ctx.fillText("✦ Resumo do amor", pad, 150);
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillText(fmtDate(dayToDate(summary.day)), pad, 200);

  ctx.font = "120px system-ui";
  ctx.fillText(v.emoji, pad, 430);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 84px Georgia, serif";
  let y = 600;
  for (const line of wrap(ctx, summary.title, W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += 96;
  }

  y += 24;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "44px system-ui, sans-serif";
  for (const line of wrap(ctx, summary.message, W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += 62;
  }

  if (summary.tip) {
    y += 30;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    const tipLines = wrap(ctx, "💡 " + summary.tip, W - pad * 2 - 60);
    const boxH = tipLines.length * 54 + 48;
    roundRect(ctx, pad, y, W - pad * 2, boxH, 28);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "38px system-ui, sans-serif";
    let ty = y + 24;
    for (const line of tipLines) {
      ctx.fillText(line, pad + 30, ty);
      ty += 54;
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 40px Georgia, serif";
  ctx.fillText("Enlace", pad, H - 180);
  ctx.font = "34px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const nameW = ctx.measureText(names).width;
  ctx.fillText(names, W - pad - nameW, H - 174);

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
  const file = new File([blob], `enlace-resumo-${summary.day}.png`, { type: "image/png" });

  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Resumo do amor", text: summary.title });
      return;
    } catch {
      /* usuário cancelou → cai pro download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
