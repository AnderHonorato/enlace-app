export const W = 720;
export const H = 1280;

/** Corta o texto com "…" se passar da largura. */
export function cortarTexto(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

/** Interpola duas cores hex (aceita #rrggbbaa) para animar o preenchimento. */
export function misturarCoresHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace("#", "");
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
      a: s.length >= 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1,
    };
  };
  const a = parse(from);
  const b = parse(to);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgba(${m(a.r, b.r)},${m(a.g, b.g)},${m(a.b, b.b)},${(a.a + (b.a - a.a) * t).toFixed(3)})`;
}

export function quebrarLinhas(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function desenharRadial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, color);
  rg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
}

export function desenharImagemCobrindo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ar = img.width / img.height;
  const target = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ar > target) {
    sw = img.height * target;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / target;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function tracarRetanguloArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
