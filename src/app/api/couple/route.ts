import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";

const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 7);

export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    if (user.coupleId) return bad("Você já faz parte de um casal.");

    const couple = await prisma.couple.create({
      data: {
        inviteCode: code(),
        name: user.displayName || user.name,
        members: { connect: { id: user.id } },
      },
    });
    // Vincula as memórias existentes ao casal e passa a compartilhá-las —
    // é um diário de casal: o que já estava escrito passa a ser de vocês dois.
    // (dá pra tornar uma memória privada de novo pelo menu dela)
    await prisma.entry.updateMany({
      where: { authorId: user.id, coupleId: null },
      data: { coupleId: couple.id, visibility: "shared" },
    });
    return json({ couple: { id: couple.id, inviteCode: couple.inviteCode } }, 201);
  });
}

const patchSchema = z.object({
  name: z.string().trim().max(80).optional(),
  anniversary: z.string().datetime().nullable().optional(),
  metDate: z.string().datetime().nullable().optional(),
  howWeMet: z.string().max(4000).nullable().optional(),
  mascotName: z.string().trim().max(24).nullable().optional(),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você não faz parte de um casal.");
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const { name, anniversary, metDate, howWeMet, mascotName } = parsed.data;

    await prisma.couple.update({
      where: { id: user.coupleId },
      data: {
        name: name,
        anniversary:
          anniversary === undefined ? undefined : anniversary ? new Date(anniversary) : null,
        metDate: metDate === undefined ? undefined : metDate ? new Date(metDate) : null,
        howWeMet: howWeMet === undefined ? undefined : howWeMet?.trim() || null,
        mascotName: mascotName === undefined ? undefined : mascotName?.trim() || null,
      },
    });
    return json({ ok: true });
  });
}
