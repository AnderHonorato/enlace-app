"use client";
import { criarCenas } from "@/componentes/retrospectiva/criar-cenas";
import { carregarImagem } from "@/componentes/retrospectiva/compartilhar-imagem";
import type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "@/componentes/retrospectiva/tipos";
import { constellationOf, moonPhase, seasonOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";


import { H, W, cortarTexto, desenharImagemCobrindo, desenharRadial, misturarCoresHex, quebrarLinhas, tracarRetanguloArredondado } from "./utilitarios-canvas";

export function desenharPulsoAplicativo(
  ctx: CanvasRenderingContext2D,
  stats: NonNullable<DadosRetrospectiva["appStats"]>,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const cards = [
    stats.chatMessages > 0 && [stats.chatMessages, "mensagens"],
    stats.gamesPlayed > 0 && [stats.gamesPlayed, "jogos"],
    stats.tasksDone > 0 && [stats.tasksDone, "tarefas feitas"],
    stats.wishesDone + stats.goalsDone > 0 && [stats.wishesDone + stats.goalsDone, "planos atuais"],
    stats.capsules > 0 && [stats.capsules, "cápsulas"],
    stats.surprises > 0 && [stats.surprises, "surpresas"],
  ].filter(Boolean).slice(0, 6) as [number, string][];
  const width = 252;
  const height = 116;
  const gap = 18;
  ctx.save();
  cards.forEach(([value, label], index) => {
    const appear = Math.min(1, Math.max(0, (local - index * 0.05) / 0.24));
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = cx - width - gap / 2 + col * (width + gap);
    const y = cy - 150 + row * (height + gap) + (1 - appear) * 24;
    ctx.globalAlpha = alpha * appear;
    tracarRetanguloArredondado(ctx, x, y, width, height, 14);
    ctx.fillStyle = "rgba(246,241,232,0.94)";
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#a32e4c";
    ctx.font = "700 42px Georgia, serif";
    ctx.fillText(value.toLocaleString("pt-BR"), x + 18, y + 52);
    ctx.fillStyle = "#57503f";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(label.toUpperCase().slice(0, 22), x + 18, y + 88);
  });
  ctx.restore();
}

export function desenharPlanos(
  ctx: CanvasRenderingContext2D,
  stats: NonNullable<DadosRetrospectiva["appStats"]>,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const rows = [
    stats.tasksCreated > 0 && ["Tarefas", stats.tasksDone, stats.tasksCreated],
    stats.wishesCreated > 0 && ["Lista de desejos", stats.wishesDone, stats.wishesCreated],
    stats.goalsCreated > 0 && ["Metas", stats.goalsDone, stats.goalsCreated],
  ].filter(Boolean) as [string, number, number][];
  ctx.save();
  rows.forEach(([label, done, total], index) => {
    const appear = Math.min(1, Math.max(0, (local - index * 0.08) / 0.25));
    const y = cy - 130 + index * 142 + (1 - appear) * 22;
    ctx.globalAlpha = alpha * appear;
    tracarRetanguloArredondado(ctx, cx - 270, y, 540, 116, 24);
    ctx.fillStyle = "rgba(255,255,255,0.13)";
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(label, cx - 240, y + 42);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText(`${done}/${total}`, cx + 240, y + 42);
    tracarRetanguloArredondado(ctx, cx - 240, y + 70, 480, 13, 7);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();
    const pct = total > 0 ? Math.min(1, done / total) : 0;
    tracarRetanguloArredondado(ctx, cx - 240, y + 70, 480 * pct * appear, 13, 7);
    ctx.fillStyle = "#ed9ab1";
    ctx.fill();
  });
  ctx.restore();
}

export function desenharJogos(
  ctx: CanvasRenderingContext2D,
  stats: NonNullable<DadosRetrospectiva["appStats"]>,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const names: Record<string, string> = {
    tictactoe: "Jogo da velha", verdade: "Verdade", complete: "Complete a frase",
    filmeemoji: "Filme por emoji", memoria: "Memória", desenho: "Rabisca", rabisca: "Rabisca",
  };
  const pop = Math.min(1, local / 0.3);
  ctx.save();
  ctx.globalAlpha = alpha * pop;
  tracarRetanguloArredondado(ctx, cx - 280, cy - 190, 560, 390, 38);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText("PLACAR DA DIVERSÃO", cx, cy - 125);
  ctx.fillStyle = "#fff";
  ctx.font = "700 116px Georgia, serif";
  ctx.fillText(stats.gamePoints.toLocaleString("pt-BR"), cx, cy + 10);
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.76)";
  ctx.fillText("pontos nos jogos", cx, cy + 60);
  if (stats.favoriteGame) {
    ctx.globalAlpha = alpha * Math.min(1, Math.max(0, (local - 0.35) / 0.25));
    ctx.fillStyle = "#ed9ab1";
    ctx.font = "600 38px Georgia, serif";
    ctx.fillText(names[stats.favoriteGame] ?? stats.favoriteGame, cx, cy + 145);
  }
  ctx.restore();
}
