import { requireUser, json, bad, handle } from "@/nucleo/api";
import { prisma } from "@/nucleo/prisma";
import { z } from "zod";

const saveSchema = z.object({
  year: z.number().int(),
  semester: z.number().int().min(1).max(2),
  slideKey: z.string().nullable().optional(),
  trackId: z.string(),
  trackName: z.string(),
  artist: z.string(),
  image: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ songs: [] });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("ano"));
    const semester = Number(searchParams.get("semestre"));

    const where: any = { coupleId: user.coupleId };
    if (year) where.year = year;
    if (semester) where.semester = semester;

    const songs = await prisma.retroMusic.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return json({ songs });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor primeiro.", 400);

    const body = saveSchema.parse(await req.json());
    const slideKey = body.slideKey ?? null;

    const existing = await prisma.retroMusic.findFirst({
      where: { coupleId: user.coupleId, year: body.year, semester: body.semester, slideKey },
    });

    let song;
    if (existing) {
      song = await prisma.retroMusic.update({
        where: { id: existing.id },
        data: { trackId: body.trackId, trackName: body.trackName, artist: body.artist, image: body.image },
      });
    } else {
      song = await prisma.retroMusic.create({
        data: {
          coupleId: user.coupleId,
          year: body.year,
          semester: body.semester,
          slideKey,
          trackId: body.trackId,
          trackName: body.trackName,
          artist: body.artist,
          image: body.image,
        },
      });
    }

    return json({ song });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu amor primeiro.", 400);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return bad("ID não informado.", 400);

    const song = await prisma.retroMusic.findFirst({
      where: { id, coupleId: user.coupleId },
    });
    if (!song) return bad("Música não encontrada.", 404);

    await prisma.retroMusic.delete({ where: { id } });
    return json({ ok: true });
  });
}
