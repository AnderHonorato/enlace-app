// Cache somente de arquivos públicos/estáticos. HTML autenticado nunca entra
// no cache: além de ficar desatualizado, poderia reaparecer para outra conta
// usando o mesmo navegador.
const CACHE = "enlace-static-v3";
const SHELL = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Notificações push ──────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Enlace", body: "Você tem uma novidade 💜", url: "/app" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || "enlace",
      renotify: true,
      data: { url: data.url || "/app" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Se o app já estiver aberto, foca nele
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Nunca cacheia chamadas de API.
  if (url.pathname.startsWith("/api")) return;

  // Navegação autenticada é sempre da rede. A navegação interna do Next já
  // reutiliza o shell montado e os chunks estáticos continuam cacheados.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  // Assets estáticos: cache primeiro.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/uploads/"))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
