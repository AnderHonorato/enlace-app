/**
 * Teste de fumaça rápido para a varredura de reskin (glass/glow/paleta).
 * Cobre as páginas cujos componentes foram alterados: Bichinho, evento do dia,
 * mapa ao vivo, modo de campanha e linha do tempo do casal.
 */
export {}; // torna o arquivo um módulo — evita colidir com os outros scripts avulsos

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

  console.log("\n=== páginas tocadas pela varredura de reskin ===");
  const paginas = [
    "/", "/app", "/app/bichinho", "/app/jogos", "/app/ao-vivo",
  ];
  let ruins = 0;
  for (const p of paginas) {
    const r = await req(p);
    const ok = r.status < 400;
    if (!ok) ruins++;
    console.log(marca(ok), p.padEnd(18), "→", r.status);
  }

  console.log(`\n=== resumo: ${ruins} página(s) com erro ===`);
  process.exit(ruins === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
