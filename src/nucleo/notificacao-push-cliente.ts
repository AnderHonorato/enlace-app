"use client";

// Inscrição em notificações push no navegador (PWA).

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/** Pede permissão, registra o SW e devolve a inscrição pronta pro servidor. */
export async function subscribeToPush(vapidPublicKey: string) {
  if (!pushSupported()) throw new Error("Seu navegador não suporta notificações.");
  if (!vapidPublicKey) throw new Error("Notificações não configuradas no servidor.");

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permissão de notificação negada.");

  // Garante o service worker registrado (no dev ele não registra sozinho)
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(vapidPublicKey),
    }));

  return JSON.parse(JSON.stringify(sub)) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
}

export async function unsubscribeFromPush(): Promise<string | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  return endpoint;
}
