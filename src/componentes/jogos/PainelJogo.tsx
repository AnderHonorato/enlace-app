"use client";

/**
 * O painel que aparece no topo da Central de Jogos quando existe partida em
 * aberto — convite recebido, convite enviado, partida rolando ou o resumo do
 * fim.
 *
 * Ele descobre a sessão de dois jeitos, e os dois importam:
 *
 * 1. `?sessao=<id>` na URL — é o link que a notificação push manda.
 * 2. `GET /api/jogos` — a sessão em aberto do casal. Sem isto, quem recebeu o
 *    convite só descobriria clicando na notificação; abrindo a página no
 *    braço, não veria nada. Como o servidor só permite UMA sessão aberta por
 *    casal, essa busca é suficiente e não precisa de lista.
 *
 * Enquanto não há partida, o componente não renderiza nada — e o `useGameSession`
 * não faz poll nenhum, porque recebe `null`.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/nucleo/cliente";
import type { SessionDTO } from "@/nucleo/jogos/tipos";
import { useGameSession, convidarParaJogo } from "./usarSessaoJogo";
import { JogoSessao } from "./SessaoJogo";
import { toast } from "../Avisos";

const boardLoading = () => <div className="h-64 animate-pulse rounded-2xl border border-border2 bg-surface2" aria-label="Carregando tabuleiro" />;
const MemoriaBoard = dynamic(() => import("./TabuleiroMemoria").then((m) => m.MemoriaBoard), { loading: boardLoading });
const DesenhoBoard = dynamic(() => import("./TabuleiroDesenho").then((m) => m.DesenhoBoard), { loading: boardLoading });
const CompleteBoard = dynamic(() => import("./TabuleiroCompleteFrase").then((m) => m.CompleteBoard), { loading: boardLoading });
const FilmeEmojiBoard = dynamic(() => import("./TabuleiroPistasCinema").then((m) => m.FilmeEmojiBoard), { loading: boardLoading });
const VelhaBoard = dynamic(() => import("./TabuleiroVelha").then((m) => m.VelhaBoard), { loading: boardLoading });
const VerdadeBoard = dynamic(() => import("./TabuleiroVerdade").then((m) => m.VerdadeBoard), { loading: boardLoading });

export function PainelJogo() {
  const params = useSearchParams();
  const router = useRouter();
  const daUrl = params.get("sessao");
  const [id, setId] = useState<string | null>(daUrl);

  // Procura uma sessão em aberto ao montar, para quem chegou sem o link.
  useEffect(() => {
    if (daUrl) {
      setId(daUrl);
      return;
    }
    let vivo = true;
    api<{ session: SessionDTO | null }>("/api/jogos")
      .then((r) => {
        // `/api/jogos` devolve a ÚLTIMA sessão do casal, inclusive encerrada —
        // e isso é útil para quem acabou de terminar a partida e recarregou.
        // Mas adotar uma sessão encerrada na carga da página faz o resumo
        // ("Empate", "João saiu") reaparecer para sempre, toda vez que alguém
        // abre a Central de Jogos. Então, ao carregar, só assumimos partida em
        // aberto. Quem estava com a sessão na tela quando ela acabou continua
        // vendo o fim, porque nesse caso o `id` já está no estado — este efeito
        // nem roda de novo.
        if (!vivo || !r.session) return;
        if (r.session.status === "pending" || r.session.status === "active") {
          setId(r.session.id);
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [daUrl]);

  const { session, error, busy, jogar, aceitar, recusar, sair } = useGameSession(id);

  const limpar = useCallback(() => {
    setId(null);
    if (daUrl) router.replace("/app/jogos");
  }, [daUrl, router]);

  const deNovo = useCallback(async () => {
    if (!session) return;
    try {
      const nova = await convidarParaJogo(session.game as any);
      setId(nova.id);
    } catch (e: any) {
      toast(e?.message || "Não consegui criar a partida.", "error");
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="mb-6">
      <JogoSessao
        sessao={session}
        ocupado={busy}
        onAceitar={() => aceitar().catch((e) => toast(e?.message || "Não deu para aceitar.", "error"))}
        onRecusar={() => recusar().then(limpar).catch(() => {})}
        onSair={() => sair().catch(() => {})}
        onJogarDeNovo={deNovo}
      >
        <Tabuleiro sessao={session} ocupado={busy} jogar={jogar} />
      </JogoSessao>

      {error ? (
        <p className="mt-2 text-center text-[12.5px] font-medium text-danger">{error}</p>
      ) : null}
    </div>
  );
}

/** Escolhe o tabuleiro pelo slug do jogo. Jogo sem tela ainda cai no aviso. */
function Tabuleiro({
  sessao,
  ocupado,
  jogar,
}: {
  sessao: SessionDTO;
  ocupado: boolean;
  jogar: (move: Record<string, any>) => Promise<SessionDTO | undefined>;
}) {
  if (sessao.game === "memoria") {
    return (
      <MemoriaBoard
        estado={sessao.state}
        minhaVez={sessao.isMyTurn}
        ocupado={ocupado}
        onVirar={(index) => {
          jogar({ type: "virar", index }).catch(() => {});
        }}
      />
    );
  }

  if (sessao.game === "desenho") {
    // Em "desenho", `turnUserId` é quem DESENHA — não quem está livre para
    // agir. Quem adivinha joga o tempo todo (chutando), então `isMyTurn` não
    // serve como "posso interagir": o tabuleiro precisa saber o papel.
    return (
      <DesenhoBoard
        estado={sessao.state}
        souEuQuemDesenha={sessao.isMyTurn}
        ocupado={ocupado}
        onJogar={(move) => {
          jogar(move).catch(() => {});
        }}
      />
    );
  }

  if (sessao.game === "complete") {
    // Simultâneo: `isMyTurn` não existe aqui (ver comentário no topo de
    // CompleteBoard.tsx) — o tabuleiro decide sozinho, olhando `sessao.state`,
    // se eu já respondi essa rodada.
    return (
      <CompleteBoard
        estado={sessao.state}
        meId={sessao.meId}
        parceiroNome={sessao.partner.name}
        ocupado={ocupado}
        onJogar={(move) => {
          jogar(move).catch(() => {});
        }}
      />
    );
  }

  if (sessao.game === "filmeemoji") {
    return (
      <FilmeEmojiBoard
        estado={sessao.state}
        meId={sessao.meId}
        parceiroNome={sessao.partner.name}
        ocupado={ocupado}
        onJogar={(move) => {
          jogar(move).catch(() => {});
        }}
      />
    );
  }

  if (sessao.game === "velha") {
    return (
      <VelhaBoard
        estado={sessao.state}
        meId={sessao.meId}
        parceiroNome={sessao.partner.name}
        minhaVez={sessao.isMyTurn}
        ocupado={ocupado}
        onJogar={(move) => {
          jogar(move).catch(() => {});
        }}
      />
    );
  }

  if (sessao.game === "verdade") {
    // Em "verdade", `turnUserId` é quem RESPONDE — não quem sorteia. Quem NÃO
    // está na vez de responder é quem provoca o parceiro sorteando a próxima
    // verdade ou desafio, então o tabuleiro precisa do papel, não só de
    // "isMyTurn" (mesma ideia do comentário em "desenho" acima).
    return (
      <VerdadeBoard
        estado={sessao.state}
        meId={sessao.meId}
        parceiroNome={sessao.partner.name}
        souEuQuemResponde={sessao.isMyTurn}
        ocupado={ocupado}
        onJogar={(move) => {
          jogar(move).catch(() => {});
        }}
      />
    );
  }

  return (
    <p className="rounded-2xl border border-border2 bg-surface p-5 text-center text-[13.5px] text-muted">
      A tela de <strong className="text-text">{sessao.gameLabel}</strong> ainda está sendo
      construída. O placar e o convite acima já funcionam.
    </p>
  );
}
