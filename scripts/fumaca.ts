/**
 * Teste de fumaça contra o servidor rodando em 3007.
 *
 * Os agentes morreram no limite de sessão antes de exercitar o que
 * escreveram — `tsc` passar só prova que os tipos fecham, não que a rota
 * responde. Este script bate nas telas e nas rotas novas de verdade.
 */
export {}; // torna o arquivo um módulo — sem isto, `BASE`/`main` caem no escopo
           // global e colidem com os outros scripts avulsos desta pasta.

const BASE = "http://localhost:3007";

let cookie = "";

async function req(path: string, init: RequestInit = {}) {
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
  return r;
}

function marca(ok: boolean) {
  return ok ? "  ok  " : " FALHA";
}

async function main() {
  console.log("=== login ===");
  const login = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ana@enlace.app", password: "enlace123" }),
  });
  console.log(marca(login.ok), "POST /api/auth/login →", login.status);
  if (!login.ok) {
    console.log("   corpo:", (await login.text()).slice(0, 200));
    process.exit(1);
  }

  console.log("\n=== páginas ===");
  const paginas = [
    "/", "/app", "/app/nos", "/app/jogos", "/app/radio", "/app/bichinho",
    "/app/conversa", "/app/album", "/app/planos", "/app/config", "/app/novo",
    "/app/tarefas", "/app/trofeus", "/app/livro", "/app/resumos",
  ];
  let ruins = 0;
  for (const p of paginas) {
    const r = await req(p);
    const ok = r.status < 400;
    if (!ok) ruins++;
    console.log(marca(ok), p.padEnd(18), "→", r.status);
  }

  console.log("\n=== rota nova: rádio compartilhada ===");
  const g1 = await req("/api/radio/agora");
  console.log(marca(g1.ok), "GET  /api/radio/agora →", g1.status, (await g1.clone().text()).slice(0, 90));

  const p1 = await req("/api/radio/agora", {
    method: "POST",
    body: JSON.stringify({
      trackId: "teste-1", trackName: "Teste de Fumaça", artist: "Enlace", image: null,
    }),
  });
  console.log(marca(p1.ok), "POST /api/radio/agora →", p1.status, (await p1.clone().text()).slice(0, 90));

  const g2 = await req("/api/radio/agora");
  const corpo = await g2.text();
  const gravou = corpo.includes("Teste de Fumaça");
  console.log(marca(g2.ok && gravou), "GET  /api/radio/agora (releitura) →", g2.status);
  console.log("      guardou a faixa que o parceiro veria?", gravou ? "sim" : "NÃO");

  console.log("\n=== rotas novas: jogos ===");
  for (const [m, p, body] of [
    ["GET", "/api/jogos", undefined],
    // a chave é `game` (não `jogo`) — ver api/jogos/convite/route.ts
    ["POST", "/api/jogos/convite", JSON.stringify({ game: "memoria" })],
  ] as const) {
    try {
      const r = await req(p, body ? { method: m, body } : { method: m });
      console.log(marca(r.status < 500), `${m.padEnd(4)} ${p.padEnd(22)} →`, r.status, (await r.text()).slice(0, 110));
    } catch (e: any) {
      console.log(" FALHA", m, p, e.message);
    }
  }

  console.log(`\n=== resumo: ${ruins} página(s) com erro ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
