"use client";

import { useState } from "react";
import { ListMusic, Loader2, Upload } from "lucide-react";
import { toast } from "./Avisos";

type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  image: string | null;
};

export function SpotifyPlaylistImporter() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function importPlaylist() {
    if (!url.trim()) {
      toast("Cole o link de uma playlist do Spotify.", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/spotify/playlist?url=" + encodeURIComponent(url.trim()));
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Não foi possível ler a playlist.");
      const tracks: SpotifyTrack[] = data.tracks ?? [];
      if (!tracks.length) throw new Error("Essa playlist não tem faixas importáveis.");
      const savedResponse = await fetch("/api/radio/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks }),
      });
      const saved = await savedResponse.json();
      if (!savedResponse.ok || saved.error) throw new Error(saved.error || "Não foi possível salvar as músicas.");
      toast(String(saved.added?.length ?? 0) + " músicas importadas · " + String(saved.skipped ?? 0) + " já estavam na rádio.", "success");
      setUrl("");
      window.location.reload();
    } catch (error: any) {
      toast(error?.message || "Não foi possível importar a playlist.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="scrap-frame scrap-frame-tape mb-5 rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-accent2/10 p-4 shadow-soft">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"><ListMusic size={20} /></span>
        <div>
          <h2 className="font-display text-xl text-text">Trazer uma playlist</h2>
          <p className="text-xs leading-relaxed text-muted">Cole um link do Spotify e adicione até 100 faixas à rádio de vocês.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://open.spotify.com/playlist/..." className="focus-ring min-w-0 flex-1 rounded-2xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint" />
        <button type="button" onClick={importPlaylist} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? "Importando…" : "Importar"}
        </button>
      </div>
    </section>
  );
}
