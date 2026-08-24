/**
 * Exercita o fluxo real de "velha" e "verdade" em dupla, com DUAS sessões
 * logadas (Ana e João), provando que os payloads que VelhaBoard e
 * VerdadeBoard mandam são aceitos pelo servidor (não um 400).
 */
export {}; // sem isto os nomes de topo colidem com outros scripts.

const BASE = "http://localhost:3007";

function cliente(nome: string) {
  let cookie = "";
  return {
    nome,
    async req(path: string, init: RequestInit = {}) {
      const r = await fetch(BASE + path, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
          ...(init.headers || {}),
        },
        redirect: "manual",
      });
      const set = r.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      let corpo: any = null;
      try { corpo = JSON.parse(await r.text()); } catch {}
      return { status: r.status, corpo };
    },
    async login(email: string) {
      const r = await this.req("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "enlace123" }),
      });
      console.log(`  ${nome}: login ${email} → ${r.status}`);
      return r.status === 200;
    },
  };
}

const p = (r: any) => JSON.stringify(r.corpo).slice(0, 220);

async function limparSessaoAberta(ana: ReturnType<typeof cliente>) {
  const aberta = await ana.req("/api/jogos");
  if (aberta.corpo?.session?.id) {
    await ana.req(`/api/jogos/${aberta.corpo.session.id}/sair`, { method: "POST" });
    console.log("  encerrou sessão anterior");
  } else {
    console.log("  nenhuma aberta");
  }
}

async function testarVelha(ana: ReturnType<typeof cliente>, joao: ReturnType<typeof cliente>) {
  console.log("\n\n########## VELHA ##########");
  console.log("\n=== limpa sessão aberta, se houver ===");
  await limparSessaoAberta(ana);

  console.log("\n=== 1. Ana convida para 'velha' ===");
  const conv = await ana.req("/api/jogos/convite", {
    method: "POST",
    body: JSON.stringify({ game: "velha" }),
  });
  console.log("  POST /api/jogos/convite →", conv.status, p(conv));
  const id = conv.corpo?.session?.id;
  if (!id) return console.log("  sem id de sessão — parando velha.");

  console.log("\n=== 2. João aceita ===");
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log("  POST /aceitar →", ac.status, p(ac));
  console.log("  status virou 'active'?", ac.corpo?.session?.status === "active" ? "sim" : "NÃO");

  console.log("\n=== 3. quem começa marca a célula 0 — payload do VelhaBoard: {type:'jogar', index} ===");
  const antes = await ana.req(`/api/jogos/${id}`);
  const vez = antes.corpo?.session?.state?.turn;
  const meId = antes.corpo?.session?.meId;
  const daVez = vez === meId ? ana : joao;
  const fora = daVez === ana ? joao : ana;

  const j1 = await daVez.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "jogar", index: 0 } }),
  });
  console.log(`  ${daVez.nome} (é a vez) marca célula 0 →`, j1.status, p(j1));

  console.log("\n=== 4. o turno já passou pro outro — quem acabou de jogar tenta jogar de novo, fora de vez ===");
  const j2 = await daVez.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "jogar", index: 1 } }),
  });
  console.log(`  ${daVez.nome} (NÃO é mais a vez) tenta marcar de novo →`, j2.status, p(j2));
  console.log("  servidor barrou quem não é da vez?", j2.status >= 400 ? "sim" : "NÃO");

  console.log("\n=== 5. joga até fechar uma rodada (vitória em linha 0,1,2 pra quem começou) ===");
  // Sequência: começa (idx0), fora joga idx3, começa idx1, fora joga idx4, começa idx2 → vence linha [0,1,2].
  const seq: [any, number][] = [
    [fora, 3], [daVez, 1], [fora, 4], [daVez, 2],
  ];
  let ultimo: any = j1;
  for (const [quem, idx] of seq) {
    ultimo = await quem.req(`/api/jogos/${id}/jogada`, {
      method: "POST",
      body: JSON.stringify({ move: { type: "jogar", index: idx } }),
    });
    console.log(`  ${quem.nome} marca célula ${idx} →`, ultimo.status, p(ultimo));
  }
  const winner = ultimo.corpo?.session?.state?.winner;
  console.log("  rodada tem vencedor?", winner ? `sim (${winner === daVez.nome ? "" : ""}${winner})` : "não (seguiu jogo ou empate)");

  console.log("\n=== 6. novaRodada — payload do botão 'Próxima rodada': {type:'novaRodada'} ===");
  if (winner) {
    const nr = await fora.req(`/api/jogos/${id}/jogada`, {
      method: "POST",
      body: JSON.stringify({ move: { type: "novaRodada" } }),
    });
    console.log("  POST novaRodada →", nr.status, p(nr));
    console.log("  rodada reiniciou (winner voltou a null)?", nr.corpo?.session?.state?.winner === null ? "sim" : "NÃO");
  } else {
    console.log("  (pulado — a sequência não fechou vitória, ver estado acima)");
  }

  console.log("\n=== 7. placar visível dentro da sessão ===");
  const st = await ana.req(`/api/jogos/${id}`);
  const s = st.corpo?.session;
  console.log("  myScore / partnerScore →", `myScore=${s?.myScore} partnerScore=${s?.partnerScore}`);

  console.log("\n=== 8. encerra a sessão pra não atrapalhar o próximo teste ===");
  const sai = await ana.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("  POST /sair →", sai.status);
}

async function testarVerdade(ana: ReturnType<typeof cliente>, joao: ReturnType<typeof cliente>) {
  console.log("\n\n########## VERDADE ##########");
  console.log("\n=== limpa sessão aberta, se houver ===");
  await limparSessaoAberta(ana);

  console.log("\n=== 1. Ana convida para 'verdade' ===");
  const conv = await ana.req("/api/jogos/convite", {
    method: "POST",
    body: JSON.stringify({ game: "verdade" }),
  });
  console.log("  POST /api/jogos/convite →", conv.status, p(conv));
  const id = conv.corpo?.session?.id;
  if (!id) return console.log("  sem id de sessão — parando verdade.");

  console.log("\n=== 2. João aceita ===");
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log("  POST /aceitar →", ac.status, p(ac));

  const s1 = await ana.req(`/api/jogos/${id}`);
  const turnUserId = s1.corpo?.session?.state?.turnUserId;
  const meId = s1.corpo?.session?.meId;
  const respondedor = turnUserId === meId ? ana : joao;
  const sorteador = respondedor === ana ? joao : ana;
  console.log(`  quem responde agora: ${respondedor.nome} — quem sorteia: ${sorteador.nome}`);

  console.log("\n=== 3. quem RESPONDE tenta sortear — deve ser barrado (payload {type:'sortear'}) ===");
  const bloq = await respondedor.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "sortear" } }),
  });
  console.log(`  ${respondedor.nome} (responde) tenta sortear →`, bloq.status, p(bloq));
  console.log("  servidor barrou?", bloq.status >= 400 ? "sim" : "NÃO");

  console.log("\n=== 4. quem sorteia sorteia uma verdade — payload do VerdadeBoard: {type:'sortear', kind:'verdade'} ===");
  const sort = await sorteador.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "sortear", kind: "verdade" } }),
  });
  console.log(`  ${sorteador.nome} sorteia 'verdade' →`, sort.status, p(sort));
  console.log("  current.kind === 'verdade'?", sort.corpo?.session?.state?.current?.kind === "verdade" ? "sim" : "NÃO");

  console.log("\n=== 5. sorteador tenta 'concluir' — deve ser barrado (não é ele quem responde) ===");
  const bloq2 = await sorteador.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "concluir" } }),
  });
  console.log(`  ${sorteador.nome} tenta concluir →`, bloq2.status, p(bloq2));
  console.log("  servidor barrou?", bloq2.status >= 400 ? "sim" : "NÃO");

  console.log("\n=== 6. respondedor conclui — payload do botão 'Concluí': {type:'concluir'} ===");
  const conc = await respondedor.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "concluir" } }),
  });
  console.log(`  ${respondedor.nome} conclui →`, conc.status, p(conc));
  console.log("  current voltou a null?", conc.corpo?.session?.state?.current === null ? "sim" : "NÃO");
  console.log("  turnUserId trocou (papéis alternaram)?", conc.corpo?.session?.state?.turnUserId === sorteador.nome ? "n/d (comparando por nome, ver id abaixo)" : "verificar abaixo");
  console.log("  novo turnUserId:", conc.corpo?.session?.state?.turnUserId, "| era sorteador antes:", turnUserId === (respondedor === ana ? joao : ana));

  console.log("\n=== 7. agora o antigo respondedor sorteia, o novo respondedor pula — payload {type:'pular'} ===");
  const s2 = await ana.req(`/api/jogos/${id}`);
  const turnUserId2 = s2.corpo?.session?.state?.turnUserId;
  const meId2 = s2.corpo?.session?.meId;
  const respondedor2 = turnUserId2 === meId2 ? ana : joao;
  const sorteador2 = respondedor2 === ana ? joao : ana;
  const sort2 = await sorteador2.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "sortear", kind: "desafio" } }),
  });
  console.log(`  ${sorteador2.nome} sorteia 'desafio' →`, sort2.status, p(sort2));
  const pul = await respondedor2.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "pular" } }),
  });
  console.log(`  ${respondedor2.nome} pula →`, pul.status, p(pul));
  console.log("  history tem entrada 'skipped:true'?",
    pul.corpo?.session?.state?.history?.some((h: any) => h.skipped) ? "sim" : "NÃO");

  console.log("\n=== 8. placar visível dentro da sessão ===");
  const st = await ana.req(`/api/jogos/${id}`);
  const s = st.corpo?.session;
  console.log("  myScore / partnerScore →", `myScore=${s?.myScore} partnerScore=${s?.partnerScore}`);

  console.log("\n=== 9. encerra a sessão ===");
  const sai = await ana.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("  POST /sair →", sai.status);
}

async function main() {
  const ana = cliente("Ana");
  const joao = cliente("João");

  console.log("=== login dos dois ===");
  if (!(await ana.login("ana@enlace.app"))) return console.log("Ana não logou.");
  if (!(await joao.login("joao@enlace.app"))) return console.log("João não logou.");

  await testarVelha(ana, joao);
  await testarVerdade(ana, joao);
}

main().catch((e) => { console.error(e); process.exit(1); });
