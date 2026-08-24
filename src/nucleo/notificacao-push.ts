import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;

function ensureConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@enlace.app", pub, priv);
    configured = true;
  }
  return true;
}

export function pushAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Envia uma notificação para todos os aparelhos de um usuário. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSub.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const data = JSON.stringify(payload);
  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        );
        sent++;
      } catch (err: any) {
        // 404/410 = inscrição morta (app desinstalado, permissão revogada)
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.endpoint);
      }
    })
  );

  if (dead.length) {
    await prisma.pushSub.deleteMany({ where: { endpoint: { in: dead } } }).catch(() => {});
  }
  return sent;
}

/** Notifica o parceiro (se houver) de um usuário do casal. */
export async function notifyPartner(userId: string, coupleId: string | null, payload: PushPayload) {
  if (!coupleId) return 0;
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: userId } },
    select: { id: true },
  });
  if (!partner) return 0;
  return sendToUser(partner.id, payload);
}
