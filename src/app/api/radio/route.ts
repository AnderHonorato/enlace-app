import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireIdentity, bad, json, handle } from "@/nucleo/api";

/**
 * A Rádio do casal reaproveita o mesmo acervo de músicas da retrospectiva
 * (modelo RetroMusic). As faixas adicionadas aqui ficam marcadas com este
 * slideKey para dar pra saber de onde vieram — e para não colidirem com as
 * músicas presas a um slide específico.
 */
const RADIO_KEY = "__radio";

function serialize(s: any) {
  return {
    id: s.id,
    trackId: s.trackId,
    trackName: s.trackName,
    artist: s.artist,
    image: s.image,
    /** true = adicionada direto na rádio; false = veio de um slide da retrospectiva. */
    fromRadio: s.slideKey === RADIO_KEY,
    year: s.year,
    createdAt: s.createdAt.toISOString(),
  };
}

/** Playlist do casal: tudo que já foi salvo, sem repetir faixa. */
export async function GET() {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return json({ songs: [] });

    const rows = await prisma.retroMusic.findMany({
      where: { coupleId: user.coupleId },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    // Mesma faixa pode ter sido salva em vários slides/semestres — mostra uma vez.
    const seen = new Set<string>();
    const songs = [];
    for (const r of rows) {
      if (seen.has(r.trackId)) continue;
      seen.add(r.trackId);
      songs.push(serialize(r));
    }

    return json({ songs });
  });
}

const addSchema = z.object({
  trackId: z.string().min(1).max(64),
  trackName: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  image: z.string().max(600).nullable().optional(),
});

/** Adiciona uma faixa à rádio. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return bad("Conecte-se com seu amor para montar a rádio de vocês.");

    const body = await req.json().catch(() => ({}));
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    // Já está na playlist? Não duplica.
    const existing = await prisma.retroMusic.findFirst({
      where: { coupleId: user.coupleId, trackId: d.trackId },
    });
    if (existing) return json({ song: serialize(existing), already: true });

    const now = new Date();
    const song = await prisma.retroMusic.create({
      data: {
        coupleId: user.coupleId,
        year: now.getFullYear(),
        semester: now.getMonth() < 6 ? 1 : 2,
        slideKey: RADIO_KEY,
        trackId: d.trackId,
        trackName: d.trackName,
        artist: d.artist,
        image: d.image ?? null,
      },
    });

    return json({ song: serialize(song) }, 201);
  });
}

/** Remove uma faixa da rádio (só do próprio casal). */
export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return bad("Conecte-se com seu amor primeiro.");

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("ID não informado.");

    // O filtro por coupleId impede apagar música de outro casal.
    const song = await prisma.retroMusic.findFirst({ where: { id, coupleId: user.coupleId } });
    if (!song) return bad("Música não encontrada.", 404);

    await prisma.retroMusic.delete({ where: { id } });
    return json({ ok: true });
  });
}
