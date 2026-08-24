import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { hashPassword, createSession } from "@/nucleo/autenticacao";
import { bad, json, handle } from "@/nucleo/api";

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(60),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa de ao menos 6 caracteres.").max(200),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const { name, email, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return bad("Já existe uma conta com esse e-mail.");

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
