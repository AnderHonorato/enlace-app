import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data");
  if (!data) return NextResponse.json({ error: "Parâmetro 'data' obrigatório" }, { status: 400 });

  try {
    const svg = await QRCode.toString(data, {
      type: "svg",
      width: 256,
      margin: 2,
      color: { dark: "#E5679B", light: "#ffffff" },
    });
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
