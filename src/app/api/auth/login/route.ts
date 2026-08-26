import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import {
  verifyPassword,
  createSession,
  hashPassword,
  passwordHashNeedsUpgrade,
} from "@/nucleo/autenticacao";
import { bad, json, handle } from "@/nucleo/api";
import {
  rateLimitSecure,
  rateLimitResetSecure,
  clientIp,
  tooManyMessage,
} from "@/nucleo/limite-requisicoes";

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

    const ip = clientIp(req);
    const accountKey = `login:account:${email}`;
    const ipKey = `login:ip:${ip}`;
    const [accountLimit, ipLimit] = await Promise.all([
      rateLimitSecure(accountKey, { limit: 8, windowMs: 60_000, blockMs: 5 * 60_000 }),
      rateLimitSecure(ipKey, { limit: 30, windowMs: 60_000, blockMs: 5 * 60_000 }),
    ]);

    if (!accountLimit.ok || !ipLimit.ok) {
      return bad(tooManyMessage(Math.max(accountLimit.retryAfter, ipLimit.retryAfter)), 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return bad("E-mail ou senha incorretos.", 401);
    }

    if (passwordHashNeedsUpgrade(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      });
    }

    await Promise.all([
      rateLimitResetSecure(accountKey),
      rateLimitResetSecure(ipKey),
    ]);
    await createSession(user.id);
    return json({ ok: true });
  });
}
