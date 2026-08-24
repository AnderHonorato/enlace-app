/**
 * Exercita o fluxo de jogo em dupla de ponta a ponta, com DUAS sessões
 * logadas ao mesmo tempo (Ana e João), que é o único jeito de provar o que o
 * usuário pediu: convite → aceite → os dois jogam → um sai → acaba pros dois.
 */
export {}; // idem fumaca.ts: sem isto os nomes de topo colidem entre scripts.

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

const p = (r: any) => JSON.stringify(r.corpo).slice(0, 150);

async function main() {
  const ana = cliente("Ana");
  const joao = cliente("João");

  console.log("=== login dos dois ===");
  if (!(await ana.login("ana@enlace.app"))) return console.log("Ana não logou.");
  if (!(await joao.login("joao@enlace.app"))) return console.log("João não logou.");

  console.log("\n=== limpa sessão aberta, se houver ===");
  const aberta = await ana.req("/api/jogos");
  if (aberta.corpo?.session?.id) {
    const r = await ana.req(`/api/jogos/${aberta.corpo.session.id}/sair`, { method: "POST" });
    console.log("  encerrou sessão anterior →", r.status);
  } else {
    console.log("  nenhuma aberta");
  }

  console.log("\n=== 1. Ana convida para 'memoria' ===");
  const conv = await ana.req("/api/jogos/convite", {
    method: "POST",
    body: JSON.stringify({ game: "memoria" }),
  });
  console.log("  POST /api/jogos/convite →", conv.status, p(conv));
  const id = conv.corpo?.session?.id;
  if (!id) return console.log("  sem id de sessão — parando.");

  console.log("\n=== 2. João enxerga o convite? ===");
  const vis = await joao.req("/api/jogos");
  console.log("  GET /api/jogos (João) →", vis.status, p(vis));
  console.log("  João vê a sessão pendente?", vis.corpo?.session?.id === id ? "sim" : "NÃO");

  console.log("\n=== 3. João aceita ===");
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log("  POST /aceitar →", ac.status, p(ac));
  console.log("  status virou 'active'?", ac.corpo?.session?.status === "active" ? "sim" : "NÃO");

  console.log("\n=== 4. jogadas (forma real: {type:'virar', index}) ===");
  // Quem está na vez vem do próprio estado da sessão.
  const antes = await ana.req(`/api/jogos/${id}`);
  const vez = antes.corpo?.session?.state?.turnUserId;
  const daVez = vez === antes.corpo?.session?.meId ? ana : joao;
  const fora = daVez === ana ? joao : ana;

  const j1 = await daVez.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "virar", index: 0 } }),
  });
  console.log(`  ${daVez.nome} (é a vez) vira carta 0 →`, j1.status, p(j1));

  const j2 = await fora.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "virar", index: 5 } }),
  });
  console.log(`  ${fora.nome} (NÃO é a vez) tenta jogar →`, j2.status, p(j2));
  console.log("  servidor barrou quem não é da vez?", j2.status >= 400 ? "sim" : "NÃO");

  console.log("\n=== 5. placar visível dentro da sessão ===");
  const st = await ana.req(`/api/jogos/${id}`);
  const s = st.corpo?.session;
  console.log("  GET /api/jogos/[id] →", st.status);
  console.log("  myScore / partnerScore presentes?",
    s && "myScore" in s && "partnerScore" in s ? "sim" : "NÃO",
    `→ myScore=${s?.myScore} partnerScore=${s?.partnerScore}`);

  console.log("\n=== 6. João sai — tem que acabar pros DOIS ===");
  const sai = await joao.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("  João POST /sair →", sai.status, p(sai));
  const depois = await ana.req(`/api/jogos/${id}`);
  const st2 = depois.corpo?.session?.status;
  console.log("  Ana vê status:", st2);
  console.log("  acabou para a Ana também?", st2 && st2 !== "active" ? "sim" : "NÃO");
}

main().catch((e) => { console.error(e); process.exit(1); });
