/**
 * Exercita "Complete a Frase" e "Filme em Emoji" de ponta a ponta, com DUAS
 * sessões logadas ao mesmo tempo (Ana e João) — os dois respondem, e o
 * servidor precisa revelar sozinho quando a segunda resposta chega.
 */
export {}; // sem isto os nomes de topo colidem com os outros scripts da pasta.

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
      console.log(`  ${nome}: login ${email} -> ${r.status}`);
      return r.status === 200;
    },
  };
}

const p = (r: any) => JSON.stringify(r.corpo).slice(0, 400);

async function encerraSessaoAberta(c: ReturnType<typeof cliente>) {
  const aberta = await c.req("/api/jogos");
  if (aberta.corpo?.session?.id) {
    await c.req(`/api/jogos/${aberta.corpo.session.id}/sair`, { method: "POST" });
    console.log("  sessao anterior encerrada");
  } else {
    console.log("  nenhuma aberta");
  }
}

async function rodaComplete(ana: ReturnType<typeof cliente>, joao: ReturnType<typeof cliente>) {
  console.log("\n\n########## COMPLETE A FRASE ##########");

  console.log("\n=== convite ===");
  const conv = await ana.req("/api/jogos/convite", {
    method: "POST",
    body: JSON.stringify({ game: "complete" }),
  });
  console.log("  POST /api/jogos/convite ->", conv.status, p(conv));
  const id = conv.corpo?.session?.id;
  if (!id) return console.log("  sem id de sessao - parando.");

  console.log("\n=== joao aceita ===");
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log("  POST /aceitar ->", ac.status, p(ac));
  console.log("  status ativo?", ac.corpo?.session?.status === "active" ? "sim" : "NAO");
  console.log("  simultaneo -> isMyTurn falso pros dois?",
    ac.corpo?.session?.isMyTurn === false ? "sim" : "NAO (host)");

  const visJoao = await joao.req(`/api/jogos/${id}`);
  console.log("  isMyTurn do joao?", visJoao.corpo?.session?.isMyTurn);

  console.log("\n=== estado ANTES de qualquer resposta (visao da Ana) ===");
  const antes = await ana.req(`/api/jogos/${id}`);
  console.log("  state ->", JSON.stringify(antes.corpo?.session?.state));

  console.log("\n=== Ana responde ===");
  const r1 = await ana.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", text: "porque você me faz rir todo dia" } }),
  });
  console.log("  POST /jogada (Ana) ->", r1.status, p(r1));
  console.log("  revealed ainda falso?", r1.corpo?.session?.state?.revealed === false ? "sim" : "NAO");
  console.log("  resposta da propria Ana aparece como texto?",
    typeof r1.corpo?.session?.state?.answers?.[r1.corpo?.session?.meId] === "string" ? "sim" : "NAO");

  console.log("\n=== João vê que Ana respondeu, mas NÃO o texto (booleano) ===");
  const meioJoao = await joao.req(`/api/jogos/${id}`);
  const stMeioJoao = meioJoao.corpo?.session?.state;
  const answersMeioJoao = stMeioJoao?.answers ?? {};
  const idAna = Object.keys(answersMeioJoao).find((k) => k !== meioJoao.corpo?.session?.meId);
  console.log("  answers (visão João) ->", JSON.stringify(answersMeioJoao));
  console.log("  chave da Ana virou booleano (não vaza texto)?",
    typeof answersMeioJoao[idAna as string] === "boolean" ? "sim" : "NAO");

  console.log("\n=== segunda resposta ANTES da revelação tentando de novo (Ana) -> deve barrar ===");
  const dupl = await ana.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", text: "outra resposta" } }),
  });
  console.log("  POST /jogada (Ana de novo) ->", dupl.status, p(dupl));
  console.log("  servidor barrou responder 2x?", dupl.status >= 400 ? "sim" : "NAO");

  console.log("\n=== João responde -> revela pros dois ===");
  const r2 = await joao.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", text: "porque você também me faz rir todo dia" } }),
  });
  console.log("  POST /jogada (João) ->", r2.status, p(r2));
  console.log("  revealed virou true?", r2.corpo?.session?.state?.revealed === true ? "sim" : "NAO");
  console.log("  sintonia calculada?", "sintonia" in (r2.corpo?.session?.state ?? {}) ? "sim" : "NAO",
    "->", r2.corpo?.session?.state?.sintonia);

  console.log("\n=== placar refletiu o scoreDelta? ===");
  console.log("  myScore(João)=", r2.corpo?.session?.myScore, "partnerScore(Ana p/ João)=", r2.corpo?.session?.partnerScore);

  console.log("\n=== Ana também vê revelado + texto do João agora ===");
  const posAna = await ana.req(`/api/jogos/${id}`);
  console.log("  state (Ana pós-revelação) ->", JSON.stringify(posAna.corpo?.session?.state));

  console.log("\n=== avança para a próxima rodada ===");
  const prox = await ana.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "proxima" } }),
  });
  console.log("  POST /jogada proxima ->", prox.status, p(prox));
  console.log("  round incrementou e revealed voltou a false?",
    prox.corpo?.session?.state?.round === 1 && prox.corpo?.session?.state?.revealed === false ? "sim" : "NAO");

  console.log("\n=== encerra ===");
  const sai = await ana.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("  POST /sair ->", sai.status);
}

async function rodaFilmeEmoji(ana: ReturnType<typeof cliente>, joao: ReturnType<typeof cliente>) {
  console.log("\n\n########## FILME EM EMOJI ##########");

  console.log("\n=== convite ===");
  const conv = await ana.req("/api/jogos/convite", {
    method: "POST",
    body: JSON.stringify({ game: "filmeemoji" }),
  });
  console.log("  POST /api/jogos/convite ->", conv.status, p(conv));
  const id = conv.corpo?.session?.id;
  if (!id) return console.log("  sem id de sessao - parando.");

  console.log("\n=== joao aceita ===");
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log("  POST /aceitar ->", ac.status, p(ac));

  console.log("\n=== estado antes: correctIndex deve vir null pros dois ===");
  const antesAna = await ana.req(`/api/jogos/${id}`);
  console.log("  state (Ana) ->", JSON.stringify(antesAna.corpo?.session?.state));
  console.log("  correctIndex escondido (null)?", antesAna.corpo?.session?.state?.correctIndex === null ? "sim" : "NAO");

  console.log("\n=== Ana responde idx=0 ===");
  const r1 = await ana.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", idx: 0 } }),
  });
  console.log("  POST /jogada (Ana) ->", r1.status, p(r1));
  console.log("  revealed ainda falso?", r1.corpo?.session?.state?.revealed === false ? "sim" : "NAO");

  console.log("\n=== João vê que Ana respondeu, mas sem o idx (booleano) ===");
  const meioJoao = await joao.req(`/api/jogos/${id}`);
  const stMeioJoao = meioJoao.corpo?.session?.state;
  const idAna = Object.keys(stMeioJoao?.answers ?? {}).find((k) => k !== meioJoao.corpo?.session?.meId);
  console.log("  answers (visão João) ->", JSON.stringify(stMeioJoao?.answers));
  console.log("  chave da Ana virou booleano?", typeof stMeioJoao?.answers?.[idAna as string] === "boolean" ? "sim" : "NAO");

  console.log("\n=== idx inválido é barrado ===");
  const invalido = await joao.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", idx: 9 } }),
  });
  console.log("  POST /jogada idx=9 ->", invalido.status, p(invalido));
  console.log("  servidor barrou idx fora do range?", invalido.status >= 400 ? "sim" : "NAO");

  console.log("\n=== João responde idx=0 -> revela pros dois, com bônus de velocidade ===");
  const r2 = await joao.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "responder", idx: 0 } }),
  });
  console.log("  POST /jogada (João) ->", r2.status, p(r2));
  console.log("  revealed virou true?", r2.corpo?.session?.state?.revealed === true ? "sim" : "NAO");
  console.log("  correctIndex agora visível?", typeof r2.corpo?.session?.state?.correctIndex === "number" ? "sim" : "NAO");
  console.log("  myScore(João)=", r2.corpo?.session?.myScore, "partnerScore(Ana p/ João)=", r2.corpo?.session?.partnerScore);

  console.log("\n=== avança para a próxima pergunta ===");
  const prox = await ana.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "proxima" } }),
  });
  console.log("  POST /jogada proxima ->", prox.status, p(prox));
  console.log("  round incrementou e revealed voltou a false?",
    prox.corpo?.session?.state?.round === 1 && prox.corpo?.session?.state?.revealed === false ? "sim" : "NAO");

  console.log("\n=== encerra ===");
  const sai = await ana.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("  POST /sair ->", sai.status);
}

async function main() {
  const ana = cliente("Ana");
  const joao = cliente("João");

  console.log("=== login dos dois ===");
  if (!(await ana.login("ana@enlace.app"))) return console.log("Ana não logou.");
  if (!(await joao.login("joao@enlace.app"))) return console.log("João não logou.");

  console.log("\n=== limpa sessão aberta, se houver ===");
  await encerraSessaoAberta(ana);

  await rodaComplete(ana, joao);
  await encerraSessaoAberta(ana);
  await rodaFilmeEmoji(ana, joao);
}

main().catch((e) => { console.error(e); process.exit(1); });
