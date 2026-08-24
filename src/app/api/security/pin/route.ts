import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { verifyPassword } from "@/nucleo/autenticacao";
import { rateLimit, rateLimitReset, tooManyMessage } from "@/nucleo/limite-requisicoes";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({ enabled: !!user.pinHash });
  });
}

const setSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, "O PIN deve ter de 4 a 8 números."),
});

// Define ou troca o PIN
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash: await bcrypt.hash(parsed.data.pin, 10) },
    });
    return json({ ok: true });
  });
}

const checkSchema = z.object({ pin: z.string().max(20) });

// Confere o PIN (desbloqueio do app)
export async function PUT(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.pinHash) return json({ ok: true });
    const body = await req.json().catch(() => ({}));
    const parsed = checkSchema.safeParse(body);
    if (!parsed.success) return bad("PIN inválido.");

    // Um PIN de 4 dígitos são só 10 mil combinações: sem limite, um script
    // acerta em minutos. 5 tentativas por minuto, depois 10 min de espera.
    const key = `pin:${user.id}`;
    const limit = rateLimit(key, { limit: 5, windowMs: 60_000, blockMs: 10 * 60_000 });
    if (!limit.ok) return bad(tooManyMessage(limit.retryAfter), 429);

    const ok = await bcrypt.compare(parsed.data.pin, user.pinHash);
    if (!ok) return bad("PIN incorreto.", 401);

    rateLimitReset(key);
    return json({ ok: true });
  });
}

const offSchema = z.object({ password: z.string().min(1, "Informe sua senha.") });

// Remove o PIN (exige a senha da conta)
export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = offSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const key = `pin-off:${user.id}`;
    const limit = rateLimit(key, { limit: 6, windowMs: 60_000, blockMs: 10 * 60_000 });
    if (!limit.ok) return bad(tooManyMessage(limit.retryAfter), 429);

    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return bad("Senha incorreta.", 401);
    }
    rateLimitReset(key);
    await prisma.user.update({ where: { id: user.id }, data: { pinHash: null } });
    return json({ ok: true });
  });
}
