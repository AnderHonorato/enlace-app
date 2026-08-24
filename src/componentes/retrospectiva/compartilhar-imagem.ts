import type { DadosRetrospectiva } from "./tipos";

/* ── Imagem compartilhável (story 1080x1920) ── */
export async function compartilharRetrospectiva(d: DadosRetrospectiva) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#E5679B");
  g.addColorStop(1, "#9575E8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const glow = (x: number, y: number, r: number, c: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  glow(860, 260, 460, "rgba(255,255,255,0.28)");
  glow(180, 1700, 420, "rgba(0,0,0,0.14)");

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillText(d.allTime ? "NOSSA RETROSPECTIVA" : `RETROSPECTIVA ${d.year}`, W / 2, 150);

  ctx.fillStyle = "#fff";
  ctx.font = "600 76px Georgia, serif";
  ctx.fillText(d.names.slice(0, 24), W / 2, 230);

  // colagem de polaroids no topo
  const pics = (d.photos ?? []).slice(0, 3);
  if (pics.length) {
    const imgs = await Promise.all(pics.map((p) => carregarImagem(p.url).catch(() => null)));
    const angles = [-8, 5, -3];
    imgs.forEach((im, k) => {
      if (!im) return;
      const size = 280;
      const x = W / 2 + (k - (imgs.length - 1) / 2) * 300;
      const y = 620;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angles[k] * Math.PI) / 180);
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-size / 2 - 14, -size / 2 - 14, size + 28, size + 70);
      ctx.shadowColor = "transparent";
      desenharImagemCobrindo(ctx, im, -size / 2, -size / 2, size, size);
      ctx.restore();
    });
  }

  const rows: [string, string][] = [
    [String(d.total), d.total === 1 ? "memória" : "memórias"],
    [d.words.toLocaleString("pt-BR"), "palavras de amor"],
    [String(d.photosCount ?? d.photos?.length ?? 0), "fotos"],
    [String(d.likes + d.comments), "gestos de carinho"],
  ];

  let y = pics.length ? 900 : 520;
  for (const [big, label] of rows) {
    ctx.fillStyle = "#fff";
    ctx.font = "700 96px Georgia, serif";
    ctx.fillText(big, W / 2, y);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "38px system-ui, sans-serif";
    ctx.fillText(label, W / 2, y + 58);
    y += 190;
  }

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  tracarRetanguloArredondado(ctx, 140, y - 10, W - 280, 150, 40);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "600 46px Georgia, serif";
  ctx.fillText(`${d.loveTitle.emoji} ${d.loveTitle.title}`, W / 2, y + 42);
  ctx.font = "34px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`Nível ${d.level} · ${d.points.toLocaleString("pt-BR")} pontos`, W / 2, y + 98);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("Enlace", W / 2, H - 110);

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
  const file = new File([blob], `enlace-retrospectiva-${d.year}.png`, { type: "image/png" });

  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Nossa retrospectiva" });
      return;
    } catch {
      /* cancelou */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

export function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

export function desenharImagemCobrindo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
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

function tracarRetanguloArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
