import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { serializeWish } from "@/nucleo/planos";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  kind: z.enum(["date", "lugar", "sonho", "outro"]).optional(),
  done: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const wish = await prisma.wish.findUnique({ where: { id: params.id } });
    if (!wish || wish.coupleId !== user.coupleId) return bad("Desejo não encontrado.", 404);
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const updated = await prisma.wish.update({ where: { id: wish.id }, data: parsed.data });
    return json({ wish: serializeWish(updated) });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const wish = await prisma.wish.findUnique({ where: { id: params.id } });
    if (!wish || wish.coupleId !== user.coupleId) return bad("Desejo não encontrado.", 404);
    await prisma.wish.delete({ where: { id: wish.id } });
    return json({ ok: true });
  });
}
