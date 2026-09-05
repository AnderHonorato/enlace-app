"use client";
import { createContext, createElement, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { api } from "./cliente";
import { isSecureBrowserContext } from "./midia-cliente";

export type PresenceStatus = "online" | "away" | "offline";

export type LivePartner = {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  lat: number | null;
  lng: number | null;
  updatedAt: string | null;
  lastSeenAt: string | null;
  status: PresenceStatus;
  sharing: boolean;
};

export function useLiveLocation(meId: string) {
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [partner, setPartner] = useState<LivePartner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const watchRef = useRef<number | null>(null);
  const pollRef = useRef<any>(null);

  const syncPosition = useCallback(
    (lat: number, lng: number, precisao?: number) => {
      setMyPos({ lat, lng });
      api("/api/live-location", {
        method: "POST",
        body: JSON.stringify({ lat, lng, precisao, sharing: true }),
      }).catch(() => {});
    },
    []
  );

  const startSharing = useCallback(() => {
    if (!isSecureBrowserContext()) {
      setError("A localização ao vivo precisa de HTTPS. Abra o site pelo endereço que começa com https://.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("Seu navegador não suporta localização.");
      return;
    }
    setLocating(true);
    setError(null);

    // Verifica o estado atual da permissão via Permissions API antes de solicitar
    async function request() {
      // Tenta usar a Permissions API para verificar estado
      if ("permissions" in navigator) {
        try {
          const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (perm.state === "denied") {
            setLocating(false);
            setError("Permissão de localização bloqueada. Desbloqueie nas configurações do navegador e tente novamente.");
            return;
          }
          // Se já está granted, prossegue
        } catch {
          // Permissions API pode não estar disponível para geolocation em alguns navegadores
        }
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          setSharing(true);
          syncPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          watchRef.current = navigator.geolocation.watchPosition(
            (p) => {
              syncPosition(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
            },
            (err) => {
              if (err.code === 1) {
                setError("Permissão de localização revogada. Verifique as configurações do navegador.");
                setSharing(false);
              }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        },
        (err) => {
          setLocating(false);
          if (err.code === 1) setError("Permissão de localização negada. Habilite nas configurações do navegador.");
          else if (err.code === 2) setError("Sinal de GPS indisponível. Verifique se o GPS está ativo.");
          else if (err.code === 3) setError("Tempo esgotado. Tente novamente.");
          else setError("Erro ao obter localização.");
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
    request();
  }, [syncPosition]);

  const stopSharing = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
    setMyPos(null);
    api("/api/live-location", {
      method: "POST",
      body: JSON.stringify({ sharing: false }),
    }).catch(() => {});
  }, []);

  // Heartbeat global: o status de presença não depende da página atual.
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "hidden") return;
      api("/api/presence", { method: "POST", body: JSON.stringify({}) }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 30_000);
    window.addEventListener("focus", beat);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", beat);
    };
  }, []);

  // Mantém a posição ativa sem repetir chamadas em aba oculta. O watcher já
  // envia mudanças reais; este intervalo é apenas um heartbeat de segurança.
  useEffect(() => {
    if (!sharing || !myPos) return;
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      api("/api/live-location", {
        method: "POST",
        body: JSON.stringify({ lat: myPos.lat, lng: myPos.lng, sharing: true }),
      }).catch(() => {});
    }, 15_000);
    return () => clearInterval(id);
  }, [sharing, myPos]);

  // Presença é atualizada imediatamente ao voltar para o app; em segundo
  // plano não há motivo para gastar rede e bateria do celular.
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "hidden") return;
      api<{ me: LivePartner | null; partner: LivePartner | null }>("/api/presence")
        .then((r) => {
          setPartner(r.partner);
          if (r.me?.lat != null && r.me?.lng != null) setMyPos({ lat: r.me.lat, lng: r.me.lng });
          if (r.me?.sharing && !sharing && watchRef.current == null) startSharing();
        })
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 15_000);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", poll);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", poll);
    };
  }, [sharing, startSharing]);

  // O provider fica montado no layout autenticado. Ao navegar internamente,
  // limpamos somente o watcher local e mantemos a posição no servidor.
  useEffect(() => {
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, []);

  return { myPos, sharing, partner, error, locating, startSharing, stopSharing };
}

type LiveLocationValue = ReturnType<typeof useLiveLocation>;
const LiveLocationContext = createContext<LiveLocationValue | null>(null);

export function LiveLocationProvider({ meId, children }: { meId: string; children: ReactNode }) {
  const value = useLiveLocation(meId);
  return createElement(LiveLocationContext.Provider, { value }, children);
}

export function useLiveLocationContext() {
  const value = useContext(LiveLocationContext);
  if (!value) throw new Error("useLiveLocationContext must be used inside LiveLocationProvider");
  return value;
}
