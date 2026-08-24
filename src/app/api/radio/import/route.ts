import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

const schema = z.object({
  tracks: z.array(z.object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(300),
    artist: z.string().min(1).max(300),
    image: z.string().max(600).nullable().optional(),
  })).min(1).max(100),
});

function serialize(s: any) {
  return {
    id: s.id,
    trackId: s.trackId,
    trackName: s.trackName,
    artist: s.artist,
    image: s.image,
    fromRadio: true,
    year: s.year,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor para importar músicas.");
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad("A playlist não contém faixas válidas.");
    const unique = Array.from(new Map(parsed.data.tracks.map((track) => [track.id, track])).values());
    const existing = await prisma.retroMusic.findMany({
      where: { coupleId: user.coupleId, trackId: { in: unique.map((track) => track.id) } },
      select: { trackId: true },
    });
    const existingIds = new Set(existing.map((row) => row.trackId));
    const fresh = unique.filter((track) => !existingIds.has(track.id));
    if (fresh.length) {
      const now = new Date();
      await prisma.retroMusic.createMany({
        data: fresh.map((track) => ({
          coupleId: user.coupleId!,
          year: now.getFullYear(),
          semester: now.getMonth() < 6 ? 1 : 2,
          slideKey: "__radio",
          trackId: track.id,
          trackName: track.name,
          artist: track.artist,
          image: track.image ?? null,
        })),
      });
    }
    const rows = fresh.length
      ? await prisma.retroMusic.findMany({
          where: { coupleId: user.coupleId, trackId: { in: fresh.map((track) => track.id) } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    return json({ added: rows.map(serialize), skipped: unique.length - fresh.length });
  });
}
