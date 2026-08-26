import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { entryInclude, serializeEntry } from "@/nucleo/memorias";
import { sanitizeHtml } from "@/nucleo/sanitizacao";
import { removeUploads } from "@/nucleo/envios";

const patchSchema = z.object({
  title: z.string().trim().max(140).nullable().optional(),
  content: z.string().max(20000).optional(),
  mood: z.string().max(30).nullable().optional(),
  visibility: z.enum(["shared", "private"]).optional(),
  entryDate: z.string().datetime().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  place: z.string().trim().max(120).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().max(2_000_000),
        type: z.enum(["image", "audio", "video"]).default("image"),
        caption: z.string().max(200).nullable().optional(),
        duration: z.number().int().min(0).max(3600).nullable().optional(),
      })
    )
    .max(16)
    .optional(),
});

function canSee(entry: { authorId: string; coupleId: string | null; visibility: string }, user: { id: string; coupleId: string | null }) {
  if (entry.authorId === user.id) return true;
  if (entry.coupleId && entry.coupleId === user.coupleId && entry.visibility === "shared") return true;
  return false;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const entry = await prisma.entry.findUnique({ where: { id: (await params).id }, include: entryInclude });
    if (!entry || !canSee(entry, user)) return bad("Entrada não encontrada.", 404);
    return json({ entry: serializeEntry(entry, user.id) });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const existing = await prisma.entry.findUnique({ where: { id: (await params).id } });
    if (!existing) return bad("Entrada não encontrada.", 404);
    if (existing.authorId !== user.id) return bad("Você só pode editar as suas entradas.", 403);
    if (existing.locked) return bad("Destranque a memória antes de editar.", 423);

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    if (d.attachments) {
      // apaga do disco os arquivos que não estão na nova lista
      const old = await prisma.attachment.findMany({ where: { entryId: (await params).id }, select: { url: true } });
      const keep = new Set(d.attachments.map((a) => a.url));
      await removeUploads(old.map((a) => a.url).filter((u) => !keep.has(u)));
      await prisma.attachment.deleteMany({ where: { entryId: (await params).id } });
    }

    const entry = await prisma.entry.update({
      where: { id: (await params).id },
      data: {
        title: d.title !== undefined ? d.title : undefined,
        content: d.content !== undefined ? sanitizeHtml(d.content) : undefined,
        mood: d.mood !== undefined ? d.mood : undefined,
        visibility: user.coupleId ? d.visibility : undefined,
        entryDate: d.entryDate ? new Date(d.entryDate) : undefined,
        tags: d.tags ? JSON.stringify(d.tags) : undefined,
        place: d.place !== undefined ? d.place : undefined,
        lat: d.lat !== undefined ? d.lat : undefined,
        lng: d.lng !== undefined ? d.lng : undefined,
        attachments: d.attachments?.length
          ? { create: d.attachments.map((a) => ({ url: a.url, type: a.type, caption: a.caption ?? null, duration: a.duration ?? null })) }
          : undefined,
      },
      include: entryInclude,
    });
    return json({ entry: serializeEntry(entry, user.id) });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const existing = await prisma.entry.findUnique({ where: { id: (await params).id } });
    if (!existing) return bad("Entrada não encontrada.", 404);
    if (existing.authorId !== user.id) return bad("Você só pode apagar as suas entradas.", 403);
    const files = await prisma.attachment.findMany({ where: { entryId: (await params).id }, select: { url: true } });
    await prisma.entry.delete({ where: { id: (await params).id } });
    await removeUploads(files.map((a) => a.url));
    return json({ ok: true });
  });
}
