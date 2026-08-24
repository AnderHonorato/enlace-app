import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { verifyPassword, hashPassword, createSession } from "@/nucleo/autenticacao";
import { rateLimit, rateLimitReset, tooManyMessage } from "@/nucleo/limite-requisicoes";

const schema = z.object({
  current: z.string().min(1, "Informe a senha atual."),
  next: z.string().min(6, "A nova senha precisa de ao menos 6 caracteres.").max(200),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    // Troca de senha confere a senha atual — mesma exposição do login.
    const key = `pwd:${user.id}`;
    const limit = rateLimit(key, { limit: 6, windowMs: 60_000, blockMs: 10 * 60_000 });
    if (!limit.ok) return bad(tooManyMessage(limit.retryAfter), 429);

    if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
      return bad("Senha atual incorreta.", 401);
    }
    rateLimitReset(key);
    if (parsed.data.current === parsed.data.next) {
      return bad("A nova senha precisa ser diferente da atual.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next) },
    });
    // Renova a sessão com a senha nova
    await createSession(user.id);
    return json({ ok: true });
  });
}
