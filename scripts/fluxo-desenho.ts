export {}; // módulo — evita colisão de nomes com os outros scripts avulsos.

/**
 * Exercita "Desenho & Adivinha" com os dois lados, provando que os payloads
 * que o DesenhoBoard envia são exatamente os que o servidor aceita.
 */
const BASE = "http://localhost:3007";

function cliente(nome: string) {
  let cookie = "";
  return {
    nome,
    async req(path: string, init: RequestInit = {}) {
      const r = await fetch(BASE + path, {
        ...init,
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers || {}) },
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
      return r.status === 200;
    },
  };
}

const ok = (b: boolean) => (b ? "  ok  " : " FALHA");

async function main() {
  const ana = cliente("Ana");
  const joao = cliente("João");
  console.log(ok(await ana.login("ana@enlace.app")), "login Ana");
  console.log(ok(await joao.login("joao@enlace.app")), "login João");

  // encerra o que estiver aberto
  const ab = await ana.req("/api/jogos");
  if (ab.corpo?.session?.id) await ana.req(`/api/jogos/${ab.corpo.session.id}/sair`, { method: "POST" });

  console.log("\n=== convite + aceite ===");
  const c = await ana.req("/api/jogos/convite", { method: "POST", body: JSON.stringify({ game: "desenho" }) });
  const id = c.corpo?.session?.id;
  console.log(ok(!!id), "convite →", c.status);
  const ac = await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" });
  console.log(ok(ac.corpo?.session?.status === "active"), "aceite →", ac.status);

  // Quem desenha é o turnUserId. Descobre lendo do lado da Ana.
  const s0 = await ana.req(`/api/jogos/${id}`);
  const anaDesenha = s0.corpo?.session?.isMyTurn;
  const artista = anaDesenha ? ana : joao;
  const chutador = anaDesenha ? joao : ana;
  console.log("  quem desenha:", artista.nome);

  console.log("\n=== traço (payload do DesenhoBoard: pontos 0..1) ===");
  const t = await artista.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({
      move: { type: "traco", pontos: [[0.1, 0.1], [0.4, 0.35], [0.7, 0.2]], largura: 5 },
    }),
  });
  console.log(ok(t.status === 200), "traço →", t.status, t.corpo?.error ?? "");
  console.log("  traços no estado:", t.corpo?.session?.state?.tracos?.length);

  console.log("\n=== quem adivinha NÃO pode traçar ===");
  const proibido = await chutador.req(`/api/jogos/${id}/jogada`, {
    method: "POST",
    body: JSON.stringify({ move: { type: "traco", pontos: [[0, 0], [1, 1]], largura: 5 } }),
  });
  console.log(ok(proibido.status >= 400), "→", proibido.status, proibido.corpo?.error ?? "");

  console.log("\n=== a palavra fica escondida de quem adivinha? ===");
  const vArtista = await artista.req(`/api/jogos/${id}`);
  const vChutador = await chutador.req(`/api/jogos/${id}`);
  const palavra = vArtista.corpo?.session?.state?.palavra;
  const vista = vChutador.corpo?.session?.state?.palavra;
  console.log(ok(!!palavra && vista === null), `artista vê "${palavra}", adivinhador vê ${JSON.stringify(vista)}`);

  console.log("\n=== chute errado, depois o certo ===");
  const err = await chutador.req(`/api/jogos/${id}/jogada`, {
    method: "POST", body: JSON.stringify({ move: { type: "chutar", texto: "abacaxi" } }),
  });
  console.log(ok(err.status === 200 && !err.corpo?.session?.state?.resolvido), "errado →", err.status);

  const cert = await chutador.req(`/api/jogos/${id}/jogada`, {
    method: "POST", body: JSON.stringify({ move: { type: "chutar", texto: palavra } }),
  });
  const res = cert.corpo?.session;
  console.log(ok(res?.state?.resolvido === true), "certo →", cert.status, "resolvido:", res?.state?.resolvido);
  console.log("  placar: eu", res?.myScore, "| parceiro", res?.partnerScore);

  console.log("\n=== nova rodada troca quem desenha ===");
  const nr = await chutador.req(`/api/jogos/${id}/jogada`, {
    method: "POST", body: JSON.stringify({ move: { type: "novaRodada" } }),
  });
  console.log(ok(nr.status === 200), "novaRodada →", nr.status, "| agora é minha vez:", nr.corpo?.session?.isMyTurn);

  await ana.req(`/api/jogos/${id}/sair`, { method: "POST" });
  console.log("\n(sessão de teste encerrada)");
}

main().catch((e) => { console.error(e); process.exit(1); });
