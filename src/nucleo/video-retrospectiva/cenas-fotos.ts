"use client";
import { criarCenas } from "@/componentes/retrospectiva/criar-cenas";
import { carregarImagem } from "@/componentes/retrospectiva/compartilhar-imagem";
import type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "@/componentes/retrospectiva/tipos";
import { constellationOf, moonPhase, seasonOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";


import { H, W, cortarTexto, desenharImagemCobrindo, desenharRadial, misturarCoresHex, quebrarLinhas, tracarRetanguloArredondado } from "./utilitarios-canvas";

export function desenharPolaroide(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  alpha: number,
  zoom: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#fff";
  ctx.fillRect(-size / 2 - 16, -size / 2 - 16, size + 32, size + 82);
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.rect(-size / 2, -size / 2, size, size);
  ctx.clip();
  const zs = size * zoom;
  desenharImagemCobrindo(ctx, img, -zs / 2, -zs / 2, zs, zs);
  ctx.restore();
}

export function desenharColagem(
  ctx: CanvasRenderingContext2D,
  photos: FotoRetrospectiva[],
  imgs: Map<string, HTMLImageElement>,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const spots = [
    { x: -150, y: -220, r: -8, s: 176 },
    { x: 150, y: -190, r: 7, s: 160 },
    { x: -168, y: 30, r: 5, s: 164 },
    { x: 150, y: 60, r: -6, s: 180 },
    { x: -20, y: -70, r: -2, s: 196 },
    { x: -132, y: 300, r: 9, s: 150 },
    { x: 150, y: 320, r: -9, s: 156 },
  ];
  photos.slice(0, spots.length).forEach((p, i) => {
    const im = imgs.get(p.url);
    if (!im) return;
    const appear = Math.min(1, Math.max(0, (local - i * 0.05) / 0.25));
    if (appear <= 0) return;
    desenharPolaroide(ctx, im, cx + spots[i].x, cy + spots[i].y, spots[i].s, spots[i].r, alpha * appear, 1);
  });
}

export function desenharFilme(
  ctx: CanvasRenderingContext2D,
  photos: FotoRetrospectiva[],
  imgs: Map<string, HTMLImageElement>,
  cy: number,
  local: number,
  alpha: number
) {
  const rowFn = (items: FotoRetrospectiva[], y: number, dir: number) => {
    const cell = 128;
    const gap = 10;
    const stripH = cell + 28;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, y - stripH / 2, W, stripH);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let x = 8; x < W; x += 34) {
      ctx.fillRect(x, y - stripH / 2 + 4, 14, 8);
      ctx.fillRect(x, y + stripH / 2 - 12, 14, 8);
    }
    const span = (cell + gap) * items.length;
    let offset = (local * dir * span * 0.5) % span;
    if (offset < 0) offset += span;
    ctx.beginPath();
    ctx.rect(0, y - cell / 2, W, cell);
    ctx.clip();
    for (let k = -1; k < Math.ceil(W / (cell + gap)) + 1; k++) {
      const item = items[((k % items.length) + items.length) % items.length];
      const im = imgs.get(item.url);
      const x = k * (cell + gap) - offset;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 2, y - cell / 2 - 2, cell + 4, cell + 4);
      if (im) desenharImagemCobrindo(ctx, im, x, y - cell / 2, cell, cell);
    }
    ctx.restore();
  };
  const half = Math.ceil(photos.length / 2);
  rowFn(photos.slice(0, half), cy - 78, 1);
  if (photos.length > half) rowFn(photos.slice(half), cy + 78, -1);
}

/* ─────────── Cenas novas em canvas (espelham RetroScenes.tsx) ─────────── */

/** Mural: grade de fotos, aparecendo em cascata. */
export function desenharMural(
  ctx: CanvasRenderingContext2D,
  photos: FotoRetrospectiva[],
  imgs: Map<string, HTMLImageElement>,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const cols = photos.length > 12 ? 5 : photos.length > 6 ? 4 : 3;
  const gap = 8;
  const total = W - 100;
  const cell = (total - gap * (cols - 1)) / cols;
  const rows = Math.ceil(photos.length / cols);
  const startX = cx - total / 2;
  const startY = cy - (rows * (cell + gap) - gap) / 2;

  photos.forEach((p, i) => {
    const appear = Math.min(1, Math.max(0, (local - i * 0.03) / 0.22));
    if (appear <= 0) return;
    const im = imgs.get(p.url);
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = startX + c * (cell + gap);
    const yy = startY + r * (cell + gap);
    ctx.save();
    ctx.globalAlpha = alpha * appear;
    const s = cell * (0.82 + 0.18 * appear);
    const ox = x + (cell - s) / 2;
    const oy = yy + (cell - s) / 2;
    tracarRetanguloArredondado(ctx, ox, oy, s, s, 10);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    if (im) {
      ctx.save();
      tracarRetanguloArredondado(ctx, ox, oy, s, s, 10);
      ctx.clip();
      desenharImagemCobrindo(ctx, im, ox, oy, s, s);
      ctx.restore();
    }
    ctx.restore();
  });
}

/** Mapa estelar: constelação da data, estrelas acendendo e linhas se ligando. */
