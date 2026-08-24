/**
 * Limpa o que os testes automatizados deixaram no banco:
 *  - a faixa falsa ("Teste de Fumaça") no estado da rádio do casal
 *  - sessões de jogo criadas pelos scripts que ficaram penduradas
 *
 * Não toca em memória, comentário, reação ou mensagem — nada que seja do
 * usuário. Só o estado efêmero que os testes escreveram.
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  // O campo é `nowPlaying` (string JSON, default "{}") — não `radioState`.
  const casais = await p.couple.findMany({ select: { id: true, nowPlaying: true } });
  let limpos = 0;
  for (const c of casais) {
    if (c.nowPlaying && c.nowPlaying.includes("Teste de Fumaça")) {
      await p.couple.update({ where: { id: c.id }, data: { nowPlaying: "{}" } });
      limpos++;
    }
  }
  console.log(`rádio: ${limpos} casal(is) com a faixa de teste removida`);

  const abertas = await p.gameSession.findMany({
    where: { status: { in: ["pending", "active"] } },
    select: { id: true, game: true, status: true },
  });
  if (abertas.length) {
    await p.gameSession.updateMany({
      where: { id: { in: abertas.map((s) => s.id) } },
      data: { status: "finished", endedReason: "left", finishedAt: new Date() },
    });
    console.log(`jogos: ${abertas.length} sessão(ões) de teste encerrada(s) →`,
      abertas.map((s) => `${s.game}/${s.status}`).join(", "));
  } else {
    console.log("jogos: nenhuma sessão aberta");
  }

  // Notificações de jogo geradas pelos scripts de teste. Escopo estreito de
  // propósito: SÓ o casal semente (ana@/joao@) e SÓ kind "jogo". Se o casal
  // real jogar, as notificações dele não são tocadas.
  const demo = await p.user.findMany({
    where: { email: { in: ["ana@enlace.app", "joao@enlace.app"] } },
    select: { id: true, coupleId: true },
  });
  const idsDemo = demo.map((u) => u.id);
  if (idsDemo.length) {
    const r = await p.notification.deleteMany({
      where: { userId: { in: idsDemo }, kind: "jogo" },
    });
    console.log(`notificações: ${r.count} de teste removidas das contas de demonstração`);
  }

  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
