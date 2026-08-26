import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { hashPassword, createSession } from "@/nucleo/autenticacao";
import { bad, json, handle } from "@/nucleo/api";
import { clientIp, rateLimitSecure, tooManyMessage } from "@/nucleo/limite-requisicoes";

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(60),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(10, "A senha precisa de ao menos 10 caracteres.").max(200),
});

export async function POST(req: Request) {
  return handle(async () => {
    const ipLimit = await rateLimitSecure(`cadastro:ip:${clientIp(req)}`, {
      limit: 5,
      windowMs: 60 * 60_000,
      blockMs: 60 * 60_000,
    });
    if (!ipLimit.ok) return bad(tooManyMessage(ipLimit.retryAfter), 429);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const { name, email, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return bad("Não foi possível criar a conta com esses dados.");

    const user = await prisma.user.create({
      data: {
        name,
        displayName: name.split(/\s+/)[0],
        email,
        passwordHash: await hashPassword(password),
      },
    });

    await createSession(user.id);
    return json({ ok: true });
  });
}
