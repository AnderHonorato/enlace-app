let cachedToken: string | null = null;
let tokenExpires = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpires - 60000) return cachedToken;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials not configured");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify auth failed (${res.status})`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpires = Date.now() + data.expires_in * 1000;
  return cachedToken!;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  durationMs: number;
}

export async function searchTracks(query: string, limit = 5): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];

  const token = await getAccessToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=BR`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify search failed (${res.status})`);

  const data = await res.json();
  return (data.tracks?.items ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    artist: t.artists.map((a: any) => a.name).join(", "),
    album: t.album.name,
    image: t.album.images?.[0]?.url ?? null,
    durationMs: t.duration_ms,
  }));
}

export async function getPlaylistTracks(playlistId: string, limit = 100): Promise<SpotifyTrack[]> {
  const token = await getAccessToken();
  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items?limit=100&market=BR`;
  while (nextUrl && tracks.length < limit) {
    const res: Response = await fetch(String(nextUrl), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Spotify playlist failed (${res.status})`);
    const data: { items?: any[]; next?: string | null } = await res.json();
    for (const item of data.items ?? []) {
      const t = item.track;
      if (!t?.id) continue;
      tracks.push({
        id: t.id,
        name: t.name,
        artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
        album: t.album?.name ?? "",
        image: t.album?.images?.[0]?.url ?? null,
        durationMs: t.duration_ms ?? 0,
      });
      if (tracks.length >= limit) break;
    }
    nextUrl = data.next ?? null;
  }
  return tracks;
}
