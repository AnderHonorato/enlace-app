"use client";

import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/nucleo/cliente";
import type { RabiscaActionResponse, RabiscaRoomDTO } from "@/nucleo/rabisca/tipos";
import { RabiscaGame } from "./rabisca/JogoRabisca";
import { RabiscaLobby, RabiscaTopbar } from "./rabisca/SalaEsperaRabisca";
import { RabiscaLoading, RabiscaWelcome } from "./rabisca/BoasVindasRabisca";

const POLL_MS = 1_500;

/**
 * O nome antigo foi mantido para não quebrar a rota, mas não existe mais
 * embed: todo o jogo agora roda no próprio Next/Prisma do Enlace.
 */
export function RabiscaEmbed() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const arenaRef = useRef<HTMLElement>(null);
  const [room, setRoom] = useState<RabiscaRoomDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const [isLandscape, setLandscape] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-ambient");
    root.setAttribute("data-ambient", "off");
    return () => {
      if (previous === null) root.removeAttribute("data-ambient");
      else root.setAttribute("data-ambient", previous);
    };
  }, []);

  const join = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api<{ room: RabiscaRoomDTO }>("/api/rabisca/join", {
        method: "POST",
        body: JSON.stringify({ code: normalized }),
      });
      setRoom(response.room);
    } catch (cause: any) {
      setError(cause?.message || "Não foi possível entrar na sala.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const invitedCode = new URLSearchParams(window.location.search).get("sala");
    if (invitedCode) {
      join(invitedCode);
      return () => { cancelled = true; };
    }
    api<{ room: RabiscaRoomDTO | null }>("/api/rabisca/rooms")
      .then((response) => { if (!cancelled) setRoom(response.room); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [join]);

  const refresh = useCallback(async () => {
    if (!room?.id || document.visibilityState !== "visible") return;
    try {
      const response = await api<{ room: RabiscaRoomDTO }>(`/api/rabisca/rooms/${room.id}`);
      setRoom(response.room);
      setError(null);
    } catch (cause: any) {
      setError(cause?.message || "A sala perdeu a conexão.");
    }
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id || room.status === "finished") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const tick = async () => {
      if (!cancelled) await refresh();
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    };
    const markOffline = () => navigator.sendBeacon?.(`/api/rabisca/rooms/${room.id}/presence`);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
      else markOffline();
    };
    timer = setTimeout(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", markOffline);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", markOffline);
    };
  }, [refresh, room?.id, room?.status]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    const update = () => setLandscape(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  async function createRoom() {
    setBusy(true);
    setError(null);
    try {
      const response = await api<{ room: RabiscaRoomDTO }>("/api/rabisca/rooms", { method: "POST" });
      setRoom(response.room);
    } catch (cause: any) {
      setError(cause?.message || "Não foi possível criar a sala.");
    } finally {
      setBusy(false);
    }
  }

  const action = useCallback(async (move: Record<string, unknown>, quiet = false) => {
    if (!room?.id) return undefined;
    if (!quiet) setBusy(true);
    setError(null);
    try {
      const response = await api<RabiscaActionResponse>(`/api/rabisca/rooms/${room.id}`, {
        method: "POST",
        body: JSON.stringify(move),
      });
      setRoom(response.room);
      if (response.hint === "near") {
        setNear(true);
        window.setTimeout(() => setNear(false), 2_100);
      }
      return response;
    } catch (cause: any) {
      setError(cause?.message || "Não foi possível concluir a ação.");
      throw cause;
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [room?.id]);

  async function leaveRoom() {
    if (room?.id) {
      await fetch(`/api/rabisca/rooms/${room.id}/presence?leave=1`, { method: "POST", keepalive: true }).catch(() => {});
    }
    setRoom(null);
    router.push("/app/jogos");
  }

  async function rotateGame() {
    try {
      if (!document.fullscreenElement) await arenaRef.current?.requestFullscreen?.();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: "landscape") => Promise<void> };
      await orientation.lock?.("landscape");
      setLandscape(true);
    } catch {
      setError("Gire o celular para deitar a tela. O navegador não liberou a rotação automática.");
    }
  }

  if (loading) return <RabiscaLoading />;
  if (!room) {
    return (
      <RabiscaWelcome
        busy={busy}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        error={error}
        onCreate={createRoom}
        onJoin={() => join(joinCode)}
        onBack={() => router.push("/app/jogos")}
      />
    );
  }

  return (
    <section ref={arenaRef} className="fixed inset-0 z-[80] flex min-h-0 flex-col overflow-hidden bg-bg text-text">
      <RabiscaTopbar room={room} landscape={isLandscape} onBack={leaveRoom} onRotate={rotateGame} />
      {room.status === "waiting" ? (
        <RabiscaLobby room={room} busy={busy} error={error} onAction={action} />
      ) : (
        <RabiscaGame room={room} busy={busy} error={error} near={near} reduceMotion={!!reduceMotion} onAction={action} />
      )}
    </section>
  );
}
