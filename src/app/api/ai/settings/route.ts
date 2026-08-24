import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { encryptSecret, decryptSecret, maskSecret } from "@/nucleo/criptografia";
import { isProvider } from "@/nucleo/ia";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({
      provider: user.aiProvider,
      model: user.aiModel,
      keys: {
        openai: user.aiKeyOpenai ? maskSecret(decryptSecret(user.aiKeyOpenai)) : "",
        deepseek: user.aiKeyDeepseek ? maskSecret(decryptSecret(user.aiKeyDeepseek)) : "",
        anthropic: user.aiKeyAnthropic ? maskSecret(decryptSecret(user.aiKeyAnthropic)) : "",
      },
    });
  });
}

const schema = z.object({
  provider: z.string().optional(),
  model: z.string().max(60).nullable().optional(),
  keys: z
    .object({
      openai: z.string().max(400).optional(),
      deepseek: z.string().max(400).optional(),
      anthropic: z.string().max(400).optional(),
    })
    .optional(),
});

// Sentinela: chave inalterada quando o cliente reenvia a máscara.
function keyUpdate(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined; // não mexe
  if (value === "") return null; // limpar
  if (value.includes("••")) return undefined; // máscara → mantém
  return encryptSecret(value.trim());
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    if (d.provider && !isProvider(d.provider)) return bad("Provedor inválido.");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        aiProvider: d.provider,
        aiModel: d.model !== undefined ? d.model : undefined,
        aiKeyOpenai: keyUpdate(d.keys?.openai),
        aiKeyDeepseek: keyUpdate(d.keys?.deepseek),
        aiKeyAnthropic: keyUpdate(d.keys?.anthropic),
      },
    });
    return json({ ok: true });
  });
}
