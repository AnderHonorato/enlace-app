import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { entryInclude, serializeEntry } from "@/nucleo/memorias";

const schema = z.object({
  senha: z.string().min(4, "A senha precisa de ao menos 4 caracteres.").max(200),
});

/** Tranca/destranca uma memória. A senha extra é única por usuário. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const entry = await prisma.entry.findUnique({ where: { id: params.id } });
    if (!entry) return bad("Memória não encontrada.", 404);
    if (entry.authorId !== user.id) return bad("Só quem escreveu pode trancar.", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    // Primeira vez: define a senha das memórias trancadas
    if (!user.lockedKey) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lockedKey: await bcrypt.hash(parsed.data.senha, 10) },
      });
    } else if (!(await bcrypt.compare(parsed.data.senha, user.lockedKey))) {
      return bad("Senha das memórias trancadas incorreta.", 401);
    }

    const updated = await prisma.entry.update({
      where: { id: entry.id },
      data: { locked: !entry.locked },
      include: entryInclude,
    });
    return json({ locked: updated.locked, entry: serializeEntry(updated, user.id, true) });
  });
}

/** Abre uma memória trancada conferindo a senha. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const entry = await prisma.entry.findUnique({ where: { id: params.id }, include: entryInclude });
    if (!entry) return bad("Memória não encontrada.", 404);

    const canSee =
      entry.authorId === user.id ||
      (!!entry.coupleId && entry.coupleId === user.coupleId && entry.visibility === "shared");
    if (!canSee) return bad("Sem permissão.", 403);

    // A senha é a de quem escreveu a memória
    const owner =
      entry.authorId === user.id
        ? user
        : await prisma.user.findUnique({ where: { id: entry.authorId }, select: { lockedKey: true } });

    if (!owner?.lockedKey) return bad("Essa memória não tem senha definida.", 400);
    if (!(await bcrypt.compare(parsed.data.senha, owner.lockedKey))) {
      return bad("Senha incorreta.", 401);
    }

    return json({ entry: serializeEntry(entry, user.id, true) });
  });
}
