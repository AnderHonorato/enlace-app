"use client";
import { criarCenas } from "@/componentes/retrospectiva/criar-cenas";
import { carregarImagem } from "@/componentes/retrospectiva/compartilhar-imagem";
import type { CenaRetrospectiva, DadosRetrospectiva, FotoRetrospectiva } from "@/componentes/retrospectiva/tipos";
import { constellationOf, moonPhase, seasonOf, starField } from "@/nucleo/astronomia";
import { TIER_COLOR, type Achievement } from "@/nucleo/conquistas";


import { H, W, cortarTexto, desenharImagemCobrindo, desenharRadial, misturarCoresHex, quebrarLinhas, tracarRetanguloArredondado } from "./utilitarios-canvas";

export function desenharMapaEstelar(
  ctx: CanvasRenderingContext2D,
  date: string,
  cx: number,
  cy: number,
  r: number,
  local: number,
  alpha: number
) {
  const c = constellationOf(date);
  const bg = starField(70, date.length + 5);

  ctx.save();
  ctx.globalAlpha = alpha;
  // disco do céu
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0a24";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // poeira estelar
  bg.forEach((s, i) => {
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(local * Math.PI * 2 + i));
    ctx.globalAlpha = alpha * s.o * tw;
    ctx.fillStyle = "#cfd8ff";
    ctx.beginPath();
    ctx.arc(cx - r + (s.x / 100) * r * 2, cy - r + (s.y / 100) * r * 2, s.r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  });

  const px = (p: { x: number; y: number }) => ({
    x: cx - r + (p.x / 100) * r * 2,
    y: cy - r + (p.y / 100) * r * 2,
  });

  // linhas (entram depois das estrelas)
  ctx.globalAlpha = alpha * Math.min(1, Math.max(0, (local - 0.28) / 0.3));
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  c.lines.forEach(([a, b]) => {
    const p1 = px(c.stars[a]);
    const p2 = px(c.stars[b]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // estrelas principais
  c.stars.forEach((s, i) => {
    const appear = Math.min(1, Math.max(0, (local - i * 0.05) / 0.2));
    if (appear <= 0) return;
    const p = px(s);
    ctx.globalAlpha = alpha * appear * 0.25;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.r * 5.2 * appear, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * appear;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // signo + nome + verso
  ctx.globalAlpha = alpha * Math.min(1, Math.max(0, (local - 0.45) / 0.25));
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "54px system-ui";
  ctx.fillText(c.sign, cx, cy + r + 66);
  ctx.font = "600 44px Georgia, serif";
  ctx.fillText(c.name, cx, cy + r + 116);
  ctx.globalAlpha = alpha * 0.85 * Math.min(1, Math.max(0, (local - 0.5) / 0.25));
  ctx.font = "italic 28px Georgia, serif";
  for (const line of quebrarLinhas(ctx, c.poem, W - 160)) {
    ctx.fillText(line, cx, cy + r + 158);
  }
  ctx.restore();
}

/** Lua com a iluminação real da data. */
export function desenharLua(
  ctx: CanvasRenderingContext2D,
  date: string,
  cx: number,
  cy: number,
  r: number,
  local: number,
  alpha: number
) {
  const m = moonPhase(date);
  const s = seasonOf(date);
  const shift = (1 - m.illumination) * r * 1.05;
  const waning = m.fraction > 0.5;
  const pop = Math.min(1, local / 0.3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);

  // brilho
  const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.7);
  glow.addColorStop(0, "rgba(255,255,255,0.35)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);

  // disco
  const face = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
  face.addColorStop(0, "#FFFDF5");
  face.addColorStop(1, "#D8CFE8");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = face;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  // crateras
  ctx.fillStyle = "rgba(191,180,214,0.55)";
  [[-0.28, -0.28, 0.17], [0.24, 0.14, 0.12], [-0.12, 0.38, 0.1], [0.38, -0.38, 0.07]].forEach(
    ([dx, dy, rr]) => {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, rr * r, 0, Math.PI * 2);
      ctx.fill();
    }
  );
  // sombra da fase
  ctx.globalAlpha = alpha * 0.92 * Math.min(1, Math.max(0, (local - 0.15) / 0.3));
  ctx.fillStyle = "#1a1430";
  ctx.beginPath();
  ctx.arc(waning ? -shift : shift, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha * Math.min(1, Math.max(0, (local - 0.3) / 0.25));
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "600 46px Georgia, serif";
  ctx.fillText(m.name, cx, cy + r + 74);
  ctx.globalAlpha = alpha * 0.85;
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(`${Math.round(m.illumination * 100)}% iluminada · ${s.name}`, cx, cy + r + 118);
  ctx.restore();
}

/** Contador de tempo junto, com caixinhas. */
export function desenharContador(
  ctx: CanvasRenderingContext2D,
  from: string,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const total = Math.max(0, Date.now() - new Date(from).getTime());
  const dias = Math.floor(total / 86400000);
  const horas = Math.floor((total % 86400000) / 3600000);
  const min = Math.floor((total % 3600000) / 60000);
  const seg = Math.floor((total % 60000) / 1000);

  const units: [string, string][] = [
    [dias.toLocaleString("pt-BR"), "dias"],
    [String(horas).padStart(2, "0"), "horas"],
    [String(min).padStart(2, "0"), "min"],
    [String(seg).padStart(2, "0"), "seg"],
  ];

  ctx.save();
  ctx.textAlign = "center";
  const pop = Math.min(1, local / 0.25);
  const bw = 148;
  const gap = 12;
  const totalW = units.length * bw + (units.length - 1) * gap;
  let x = cx - totalW / 2;

  units.forEach(([v, l], i) => {
    const appear = Math.min(1, Math.max(0, (local - i * 0.06) / 0.25));
    ctx.globalAlpha = alpha * appear;
    const h = 132;
    const yy = cy - h / 2 + (1 - pop) * 20;
    tracarRetanguloArredondado(ctx, x, yy, bw, h, 26);
    ctx.fillStyle = "rgba(255,255,255,0.17)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 62px Georgia, serif";
    ctx.fillText(v, x + bw / 2, yy + h / 2 + 22);
    ctx.globalAlpha = alpha * appear * 0.75;
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText(l.toUpperCase(), x + bw / 2, yy + h + 34);
    x += bw + gap;
  });

  ctx.globalAlpha = alpha * 0.9 * Math.min(1, Math.max(0, (local - 0.3) / 0.3));
  ctx.fillStyle = "#fff";
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText("E continua contando, agora mesmo.", cx, cy + 150);
  ctx.restore();
}

/** Cartões de conquista. */
export function desenharConquistas(
  ctx: CanvasRenderingContext2D,
  list: Achievement[],
  cx: number,
  top: number,
  local: number,
  alpha: number
) {
  const cardW = W - 120;
  const cardH = 132;
  const gap = 18;
  list.forEach((a, i) => {
    const appear = Math.min(1, Math.max(0, (local - 0.1 - i * 0.12) / 0.3));
    if (appear <= 0) return;
    const color = TIER_COLOR[a.tier] ?? "#fff";
    const x = cx - cardW / 2 + (1 - appear) * -40;
    const y = top + i * (cardH + gap);

    ctx.save();
    ctx.globalAlpha = alpha * appear;
    tracarRetanguloArredondado(ctx, x, y, cardW, cardH, 26);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // medalha
    const bs = 84;
    tracarRetanguloArredondado(ctx, x + 20, y + (cardH - bs) / 2, bs, bs, 20);
    ctx.fillStyle = color + "44";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "46px system-ui";
    ctx.fillStyle = "#fff";
    ctx.fillText(a.emoji, x + 20 + bs / 2, y + cardH / 2 + 17);

    // textos
    ctx.textAlign = "left";
    const tx = x + 20 + bs + 22;
    ctx.fillStyle = "#fff";
    ctx.font = "700 33px system-ui, sans-serif";
    ctx.fillText(cortarTexto(ctx, a.title, cardW - bs - 130), tx, y + 54);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "25px system-ui, sans-serif";
    ctx.fillText(cortarTexto(ctx, a.desc, cardW - bs - 70), tx, y + 92);

    // selo de raridade
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.font = "700 19px system-ui, sans-serif";
    ctx.fillText(a.tier.toUpperCase(), x + cardW - 22, y + 40);
    ctx.restore();
  });
  ctx.textAlign = "center";
}

/** Linha do tempo "Nossa jornada". */
export function desenharLinhaTempo(
  ctx: CanvasRenderingContext2D,
  items: { date: string; title: string; photo: string | null; author: string }[],
  imgs: Map<string, HTMLImageElement>,
  cx: number,
  top: number,
  local: number,
  alpha: number
) {
  const list = items.slice(0, 5);
  if (!list.length) return;
  const rowH = 104;
  const leftX = cx - (W - 150) / 2;

  // trilho
  ctx.save();
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftX + 26, top);
  ctx.lineTo(leftX + 26, top + Math.min(1, local / 0.4) * (list.length * rowH - 30));
  ctx.stroke();
  ctx.restore();

  list.forEach((it, i) => {
    const appear = Math.min(1, Math.max(0, (local - 0.12 - i * 0.11) / 0.3));
    if (appear <= 0) return;
    const y = top + i * rowH;
    ctx.save();
    ctx.globalAlpha = alpha * appear;

    // bolinha numerada
    ctx.beginPath();
    ctx.arc(leftX + 26, y + 30, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(String(i + 1), leftX + 26, y + 39);

    let tx = leftX + 68;
    // miniatura
    if (it.photo && imgs.get(it.photo)) {
      const s = 62;
      ctx.save();
      tracarRetanguloArredondado(ctx, tx, y, s, s, 14);
      ctx.clip();
      desenharImagemCobrindo(ctx, imgs.get(it.photo)!, tx, y, s, s);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      tracarRetanguloArredondado(ctx, tx, y, s, s, 14);
      ctx.stroke();
      tx += s + 18;
    }

    // texto
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "600 30px system-ui, sans-serif";
    ctx.fillText(cortarTexto(ctx, it.title, W - (tx - leftX) - 110), tx, y + 28);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "23px system-ui, sans-serif";
    const d = new Date(it.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    ctx.fillText(`${d} · ${it.author}`, tx, y + 60);
    ctx.restore();
  });
  ctx.textAlign = "center";
}

/** Mapa dos lugares: globo com pinos. */
export function desenharLugares(
  ctx: CanvasRenderingContext2D,
  places: { name: string; count: number; photo: string | null }[],
  cx: number,
  cy: number,
  r: number,
  local: number,
  alpha: number
) {
  const list = places.slice(0, 8);
  const spots = starField(list.length || 1, (list.length || 1) * 13 + 1);

  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.4, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.restore();

  list.forEach((p, i) => {
    const appear = Math.min(1, Math.max(0, (local - 0.12 - i * 0.08) / 0.28));
    if (appear <= 0) return;
    const s = spots[i] ?? { x: 50, y: 50 };
    const x = cx - r * 0.72 + (s.x / 100) * r * 1.44;
    const y = cy - r * 0.7 + (s.y / 100) * r * 1.4;

    ctx.save();
    ctx.globalAlpha = alpha * appear;
    // pino pulsando
    const pulse = 1 + 0.4 * Math.abs(Math.sin(local * Math.PI * 3 + i));
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x, y, 9 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // etiqueta
    const label = p.count > 1 ? `${p.name} ×${p.count}` : p.name;
    ctx.font = "600 23px system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const bw = tw + 26;
    const bx = Math.min(Math.max(x + 14, 12), W - bw - 12);
    tracarRetanguloArredondado(ctx, bx, y - 17, bw, 34, 17);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(label, bx + 13, y + 7);
    ctx.restore();
  });
  ctx.textAlign = "center";
}

/** Palavra do casal, estilo Wordle: peças virando e ficando verdes. */
export function desenharPalavra(
  ctx: CanvasRenderingContext2D,
  word: string,
  cx: number,
  cy: number,
  local: number,
  alpha: number
) {
  const letters = word.toUpperCase().slice(0, 8).split("");
  const tw = 92;
  const th = 108;
  const gap = 12;
  const totalW = letters.length * tw + (letters.length - 1) * gap;
  let x = cx - totalW / 2;

  letters.forEach((l, i) => {
    const flip = Math.min(1, Math.max(0, (local - 0.1 - i * 0.09) / 0.24));
    const green = Math.min(1, Math.max(0, (local - 0.3 - i * 0.09) / 0.22));
    if (flip <= 0) {
      x += tw + gap;
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    // "vira" a peça achatando na vertical
    const sy = Math.abs(Math.cos((1 - flip) * Math.PI * 0.5));
    ctx.translate(x + tw / 2, cy);
    ctx.scale(1, Math.max(0.06, sy));
    tracarRetanguloArredondado(ctx, -tw / 2, -th / 2, tw, th, 14);
    ctx.fillStyle = green > 0 ? misturarCoresHex("#ffffff1f", "#4ABE7C", green) : "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 58px Georgia, serif";
    ctx.fillText(l, 0, 20);
    ctx.restore();
    x += tw + gap;
  });
}

/** Roleta girando e parando numa opção. */
export function desenharRoleta(
  ctx: CanvasRenderingContext2D,
  options: string[],
  cx: number,
  cy: number,
  r: number,
  local: number,
  alpha: number
) {
  const opts = options.slice(0, 8);
  if (!opts.length) return;
  const colors = ["#E5679B", "#9575E8", "#5AA0F0", "#4ABEB0", "#E0A84A", "#F4726A", "#8B5CD6", "#F0883E"];
  // Escolha estável (sem Math.random) para o vídeo ser reproduzível.
  const chosen = opts.join("|").length % opts.length;
  const slice = (Math.PI * 2) / opts.length;

  // desacelera até parar com o ponteiro sobre a fatia escolhida
  const spinT = Math.min(1, local / 0.65);
  const ease = 1 - Math.pow(1 - spinT, 3);
  const finalRot = -(chosen + 0.5) * slice - Math.PI / 2;
  const rot = ease * (Math.PI * 2 * 4) + finalRot * ease;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  opts.forEach((_, i) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, i * slice, (i + 1) * slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
  });
  ctx.restore();

  // aro + centro + ponteiro
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 26);
  ctx.lineTo(cx - 17, cy - r + 6);
  ctx.lineTo(cx + 17, cy - r + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // resultado
  const show = Math.min(1, Math.max(0, (local - 0.68) / 0.2));
  if (show > 0) {
    ctx.save();
    ctx.globalAlpha = alpha * show;
    ctx.textAlign = "center";
    ctx.font = "600 34px system-ui, sans-serif";
    const label = opts[chosen];
    const tw = Math.min(ctx.measureText(label).width + 56, W - 80);
    const bx = cx - tw / 2;
    const by = cy + r + 34;
    tracarRetanguloArredondado(ctx, bx, by, tw, 96, 26);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText("CAIU EM", cx, by + 32);
    ctx.fillStyle = "#fff";
    ctx.font = "600 38px Georgia, serif";
    ctx.fillText(cortarTexto(ctx, label, tw - 30), cx, by + 74);
    ctx.restore();
  }
}
