"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/nucleo/cliente";
import type { SessionDTO } from "@/nucleo/jogos/tipos";
import type { GameSlug } from "@/nucleo/jogos";

const POLL_MS = 3000;
const isTerminalStatus = (status: SessionDTO["status"] | null) => status === "finished" || status === "abandoned";

/**
 * Dono do ciclo de vida de UMA sessão de jogo no cliente: busca, faz poll
 * enquanto a partida está pendente/ativa, pausa o poll quando a aba fica
 * escondida (só volta a chamar a API quando `document.visibilityState`
 * volta a "visible") e para de vez quando a sessão termina.
 */
export function useGameSession(sessionId: string | null, initial?: SessionDTO | null) {
  const [session, setSession] = useState<SessionDTO | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial && !!sessionId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idRef = useRef(sessionId);
  const statusRef = useRef<SessionDTO["status"] | null>(initial?.status ?? null);
  idRef.current = sessionId;
  statusRef.current = session?.status ?? null;

  const refresh = useCallback(async () => {
    if (!idRef.current) return;
    try {
      const r = await api<{ session: SessionDTO }>(`/api/jogos/${idRef.current}`);
      if (idRef.current === sessionId) setSession(r.session);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Não foi possível atualizar o jogo.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Poll: só enquanto a sessão existir, estiver pendente/ativa, e a aba
  // estiver visível. Sai do ar sozinho quando a partida termina — não fica
  // batendo na API pra sempre depois do fim.
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(!initial);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled || document.visibilityState !== "visible") return;
      if (isTerminalStatus(statusRef.current)) return;
      await refresh();
      if (cancelled) return;
      if (isTerminalStatus(statusRef.current)) return;
      schedule();
    }
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, POLL_MS);
    }
    const markOffline = () => {
      if (idRef.current) navigator.sendBeacon?.(`/api/jogos/${idRef.current}/presence`);
    };
    function onVisible() {
      if (document.visibilityState === "visible") tick();
      else markOffline();
    }

    tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", markOffline);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", markOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Assim que o status vira algo terminal, encerra o poll de propósito —
  // o efeito acima não reagenda porque a checagem de status acontece no
  // `refresh`, mas paramos aqui também pra não deixar um timer fantasma vivo
  // entre o fim de uma sessão e o começo da próxima.
  useEffect(() => {
    if (session && (session.status === "finished" || session.status === "abandoned")) {
      // nada a fazer — o próximo useEffect (sessionId muda) já limpa o timer
      // quando o componente pai trocar de sessão. Mantido explícito por clareza.
    }
  }, [session?.status]);

  const jogar = useCallback(
    async (move: Record<string, any>) => {
      if (!idRef.current) return;
      setBusy(true);
      try {
        const r = await api<{ session: SessionDTO }>(`/api/jogos/${idRef.current}/jogada`, {
          method: "POST",
          body: JSON.stringify({ move }),
        });
        setSession(r.session);
        setError(null);
        return r.session;
      } catch (e: any) {
        setError(e?.message || "Jogada inválida.");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const aceitar = useCallback(async () => {
    if (!idRef.current) return;
    setBusy(true);
    try {
      const r = await api<{ session: SessionDTO }>(`/api/jogos/${idRef.current}/aceitar`, { method: "POST" });
      setSession(r.session);
      return r.session;
    } finally {
      setBusy(false);
    }
  }, []);

  const recusar = useCallback(async () => {
    if (!idRef.current) return;
    setBusy(true);
    try {
      const r = await api<{ session: SessionDTO }>(`/api/jogos/${idRef.current}/recusar`, { method: "POST" });
      setSession(r.session);
      return r.session;
    } finally {
      setBusy(false);
    }
  }, []);

  const sair = useCallback(async () => {
    if (!idRef.current) return;
    setBusy(true);
    try {
      const r = await api<{ session: SessionDTO }>(`/api/jogos/${idRef.current}/sair`, { method: "POST" });
      setSession(r.session);
      return r.session;
    } finally {
      setBusy(false);
    }
  }, []);

  return { session, loading, error, busy, refresh, jogar, aceitar, recusar, sair };
}

/** Cria um convite novo pro parceiro. Devolve a sessão pendente criada. */
export async function convidarParaJogo(game: GameSlug): Promise<SessionDTO> {
  try {
    const r = await api<{ session: SessionDTO }>("/api/jogos/convite", {
      method: "POST",
      body: JSON.stringify({ game }),
    });
    return r.session;
  } catch (e: any) {
    // 409: já existe convite/partida em aberto — o servidor devolve a sessão
    // existente no corpo do erro mesmo assim (ver api/jogos/convite/route.ts).
    if (e?.status === 409 && e?.session) return e.session as SessionDTO;
    throw e;
  }
}
