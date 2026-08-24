import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, json, handle } from "@/nucleo/api";

const schema = z.object({
  /** createdAt (ISO) da memória nova mais recente que o usuário já viu. */
  at: z.string().datetime().optional(),
});

/**
 * Avança a marca de "feed visto".
 * Só avança — nunca retrocede — para uma memória vista não voltar a ser "nova"
 * caso chegue um POST fora de ordem.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { at } = schema.parse(body ?? {});
    const mark = at ? new Date(at) : new Date();

    const current = user.lastFeedSeenAt;
    if (!current || mark > current) {
      await prisma.user.update({ where: { id: user.id }, data: { lastFeedSeenAt: mark } });
    }
    return json({ ok: true });
  });
}
