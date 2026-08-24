import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { verifyPassword, createSession } from "@/nucleo/autenticacao";
import { bad, json, handle } from "@/nucleo/api";
import { rateLimit, rateLimitReset, clientIp, tooManyMessage } from "@/nucleo/limite-requisicoes";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const { email, password } = parsed.data;

    // Trava por e-mail + IP: protege a conta mesmo quando o ataque troca de IP,
    // e não deixa um IP varrer vários e-mails.
    const key = `login:${email}:${clientIp(req)}`;
    const limit = rateLimit(key, { limit: 8, windowMs: 60_000, blockMs: 5 * 60_000 });
    if (!limit.ok) return bad(tooManyMessage(limit.retryAfter), 429);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return bad("E-mail ou senha incorretos.", 401);
    }

    rateLimitReset(key);
    await createSession(user.id);
    return json({ ok: true });
  });
}
