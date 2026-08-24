import { requireUser, json, handle } from "@/nucleo/api";
import { getPlaylistTracks } from "@/nucleo/spotify";

export const runtime = "nodejs";

function extractPlaylistId(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/playlist[/:]([A-Za-z0-9]+)(?:\?|$)/);
  return match?.[1] ?? (/^[A-Za-z0-9]{22}$/.test(trimmed) ? trimmed : null);
}

export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return json({ error: "Spotify não configurado no servidor." }, 500);
    }
    const value = new URL(req.url).searchParams.get("url") ?? "";
    const playlistId = extractPlaylistId(value);
    if (!playlistId) return json({ error: "Cole uma URL válida de playlist do Spotify." }, 400);
    try {
      const tracks = await getPlaylistTracks(playlistId, 100);
      return json({ playlistId, tracks });
    } catch (error: any) {
      return json({ error: error?.message || "Não foi possível importar essa playlist." }, 502);
    }
  });
}
