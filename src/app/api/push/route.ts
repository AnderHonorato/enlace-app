import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { pushAvailable, sendToUser } from "@/nucleo/notificacao-push";

// Estado das notificações deste usuário
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const count = await prisma.pushSub.count({ where: { userId: user.id } });
    return json({ available: pushAvailable(), devices: count });
  });
}

const subSchema = z.object({
  endpoint: z.string().url().max(600),
  keys: z.object({ p256dh: z.string().max(300), auth: z.string().max(300) }),
});

// Registra o aparelho para receber notificações
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!pushAvailable()) return bad("Notificações não estão configuradas no servidor.");
    const body = await req.json().catch(() => ({}));
    const parsed = subSchema.safeParse(body);
    if (!parsed.success) return bad("Inscrição inválida.");

    const { endpoint, keys } = parsed.data;
    await prisma.pushSub.upsert({
      where: { endpoint },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    await sendToUser(user.id, {
      title: "Notificações ligadas 💜",
      body: "Vamos te avisar quando seu amor escrever algo.",
      url: "/app",
      tag: "welcome",
    });
    return json({ ok: true });
  });
}

// Remove o aparelho
export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const endpoint = new URL(req.url).searchParams.get("endpoint");
    if (endpoint) await prisma.pushSub.deleteMany({ where: { userId: user.id, endpoint } });
    else await prisma.pushSub.deleteMany({ where: { userId: user.id } });
    return json({ ok: true });
  });
}
