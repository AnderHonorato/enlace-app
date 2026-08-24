"use client";
import { criarCenas } from "@/componentes/retrospectiva/criar-cenas";
import { carregarImagem } from "@/componentes/retrospectiva/compartilhar-imagem";
import type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "@/componentes/retrospectiva/tipos";
import { constellationOf, moonPhase, seasonOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";


import { H, W, cortarTexto, desenharImagemCobrindo, desenharRadial, misturarCoresHex, quebrarLinhas, tracarRetanguloArredondado } from "./utilitarios-canvas";
import { desenharJogos, desenharPlanos, desenharPulsoAplicativo } from "./cenas-aplicativo";
import { desenharColagem, desenharFilme, desenharMural, desenharPolaroide } from "./cenas-fotos";
import { desenharConquistas, desenharContador, desenharLinhaTempo, desenharLua, desenharLugares, desenharMapaEstelar, desenharPalavra, desenharRoleta } from "./cenas-historia";

/** Layouts que desenham uma cena própria na metade de cima do quadro. */
const LAYOUTS_CENAS = new Set([
  "polaroid", "collage", "filmstrip", "mural",
  "starmap", "moon", "counter", "achievements", "timeline", "places", "wordle", "roleta",
  "app-pulse", "plans", "games",
]);

export function desenharSlide(
  ctx: CanvasRenderingContext2D,
  slide: CenaRetrospectiva,
  local: number,
  imgs: Map<string, HTMLImageElement>,
  songLabel?: string,
  data?: DadosRetrospectiva,
) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, slide.grad[0]);
  g.addColorStop(1, slide.grad[1]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  desenharRadial(ctx, W * 0.82, H * 0.16, W * 0.65, "rgba(255,255,255,0.25)");
  desenharRadial(ctx, W * 0.18, H * 0.86, W * 0.6, "rgba(0,0,0,0.14)");

  const fadeIn = Math.min(1, local / 0.2);
  const fadeOut = local > 0.9 ? Math.max(0, 1 - (local - 0.9) / 0.1) : 1;
  const alpha = fadeIn * fadeOut;
  const rise = (1 - fadeIn) * 26;

  ctx.textAlign = "center";
  const cx = W / 2;
  const photoSlide = LAYOUTS_CENAS.has(slide.layout ?? "");

  // ── Cena do slide ──
  // Cada layout da tela tem aqui o seu equivalente em canvas. Sem isso o
  // vídeo saía com metade dos slides em branco (era o bug relatado).
  switch (slide.layout) {
    case "polaroid":
      if (slide.photo && imgs.get(slide.photo)) {
        desenharPolaroide(ctx, imgs.get(slide.photo)!, cx, H * 0.36, 300, -3, alpha, 1 + local * 0.12);
      }
      break;
    case "collage":
      if (slide.photos) desenharColagem(ctx, slide.photos, imgs, cx, H * 0.4, local, alpha);
      break;
    case "filmstrip":
      if (slide.photos) desenharFilme(ctx, slide.photos, imgs, H * 0.36, local, alpha);
      break;
    case "mural":
      if (slide.photos) desenharMural(ctx, slide.photos, imgs, cx, H * 0.37, local, alpha);
      break;
    case "starmap":
      if (slide.date) desenharMapaEstelar(ctx, slide.date, cx, H * 0.34, 250, local, alpha);
      break;
    case "moon":
      if (slide.date) desenharLua(ctx, slide.date, cx, H * 0.33, 170, local, alpha);
      break;
    case "counter":
      if (slide.date) desenharContador(ctx, slide.date, cx, H * 0.36, local, alpha);
      break;
    case "achievements": {
      const block = Number(slide.key.split("-")[1]) || 0;
      const list = (data?.achievements ?? []).slice(block * 3, block * 3 + 3);
      desenharConquistas(ctx, list, cx, H * 0.3, local, alpha);
      break;
    }
    case "timeline":
      desenharLinhaTempo(ctx, data?.timeline ?? [], imgs, cx, H * 0.26, local, alpha);
      break;
    case "places":
      desenharLugares(ctx, data?.placeList ?? [], cx, H * 0.36, 235, local, alpha);
      break;
    case "wordle":
      if (data?.wordleWord) desenharPalavra(ctx, data.wordleWord, cx, H * 0.34, local, alpha);
      break;
    case "roleta":
      desenharRoleta(ctx, data?.roletaOptions ?? [], cx, H * 0.34, 165, local, alpha);
      break;
    case "app-pulse":
      if (data?.appStats) desenharPulsoAplicativo(ctx, data.appStats, cx, H * 0.31, local, alpha);
      break;
    case "plans":
      if (data?.appStats) desenharPlanos(ctx, data.appStats, cx, H * 0.31, local, alpha);
      break;
    case "games":
      if (data?.appStats) desenharJogos(ctx, data.appStats, cx, H * 0.32, local, alpha);
      break;
  }

  ctx.globalAlpha = alpha;
  let y = photoSlide ? H * 0.72 : H * 0.42;

  if (slide.eyebrow) {
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(slide.eyebrow.toUpperCase().slice(0, 40), cx, (photoSlide ? y - 8 : H * 0.3) + rise);
  }

  if (slide.emoji && !photoSlide) {
    ctx.font = "110px system-ui";
    ctx.fillText(slide.emoji, cx, y - 40 + rise);
  }

  if (slide.big) {
    ctx.fillStyle = "#fff";
    ctx.font = "700 130px Georgia, serif";
    ctx.fillText(slide.big, cx, y + 30 + rise);
    y += 70;
  }

  // O slide do contador tem título vazio de propósito — não reservar espaço.
  if (slide.title) {
    ctx.fillStyle = "#fff";
    ctx.font = "600 60px Georgia, serif";
    for (const line of quebrarLinhas(ctx, slide.title, W - 120)) {
      y += 66;
      ctx.fillText(line, cx, y + rise);
    }
  }

  if (slide.chips && slide.chips.length) {
    y += 40;
    ctx.font = "600 34px system-ui, sans-serif";
    for (const c of slide.chips.slice(0, 4)) {
      y += 60;
      const txt = "#" + c;
      const w = ctx.measureText(txt).width + 44;
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      tracarRetanguloArredondado(ctx, cx - w / 2, y - 40, w, 54, 27);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(txt, cx, y);
    }
  }

  if (slide.sub) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "34px system-ui, sans-serif";
    y += 24;
    for (const line of quebrarLinhas(ctx, slide.sub, W - 130)) {
      y += 46;
      ctx.fillText(line, cx, y + rise);
    }
  }

  ctx.globalAlpha = 0.8 * alpha;
  ctx.fillStyle = "#fff";
  ctx.font = "700 34px Georgia, serif";
  ctx.fillText("Enlace", cx, H - 60);

  // Música tocando
  if (songLabel) {
    ctx.globalAlpha = 0.5 * alpha;
    ctx.font = "22px system-ui, sans-serif";
    ctx.fillText(`🎵 ${songLabel}`, cx, H - 22);
  }

  ctx.globalAlpha = 1;
}
