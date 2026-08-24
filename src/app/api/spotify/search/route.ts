import { requireUser, json, handle } from "@/nucleo/api";
import { searchTracks } from "@/nucleo/spotify";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();

    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return json({ error: "Spotify não configurado. Adicione SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env" }, 500);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q || q.trim().length < 1) return json({ results: [] });

    try {
      const results = await searchTracks(q.trim());
      return json({ results });
    } catch (e: any) {
      return json({ error: e?.message || "Erro ao buscar no Spotify" }, 502);
    }
  });
}
