"use client";

export async function compressImage(
  file: File,
  maxDim = 1400,
  quality = 0.72
): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const url = canvas.toDataURL("image/jpeg", quality);
  return { url, width, height };
}
