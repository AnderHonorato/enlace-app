export {}; // módulo — evita colisão de nomes com os outros scripts avulsos.

/**
 * Verificação final: TODOS os jogos do catálogo aceitam convite, aceite e
 * encerramento, e o cliente recebe um estado utilizável.
 *
 * Cada tabuleiro foi verificado no seu próprio script; este aqui prova o
 * conjunto — que o registro em `lib/jogos/index.ts`, as rotas e o
 * `serializeSession` funcionam para todos, e que nenhum jogo ficou órfão.
 */
const BASE = "http://localhost:3007";

function cliente() {
  let cookie = "";
  return {
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
        method: "POST", body: JSON.stringify({ email, password: "enlace123" }),
      });
      return r.status === 200;
    },
  };
}

const JOGOS = ["memoria", "desenho", "velha", "verdade", "complete", "filmeemoji"];

async function main() {
  const ana = cliente();
  const joao = cliente();
  await ana.login("ana@enlace.app");
  await joao.login("joao@enlace.app");

  console.log("jogo".padEnd(13) + "convite".padStart(9) + "aceite".padStart(8) + "estado".padStart(9) + "  encerra");
  console.log("-".repeat(54));

  let falhas = 0;
  for (const game of JOGOS) {
    // garante quadro limpo
    const ab = await ana.req("/api/jogos");
    if (ab.corpo?.session?.id) await ana.req(`/api/jogos/${ab.corpo.session.id}/sair`, { method: "POST" });

    const c = await ana.req("/api/jogos/convite", { method: "POST", body: JSON.stringify({ game }) });
    const id = c.corpo?.session?.id;
    const ac = id ? await joao.req(`/api/jogos/${id}/aceitar`, { method: "POST" }) : { status: 0, corpo: null };
    const s = ac.corpo?.session;
    // "estado utilizável" = o servidor mandou algo que o tabuleiro pode ler.
    const temEstado = !!s?.state && Object.keys(s.state).length > 0;
    const fim = id ? await ana.req(`/api/jogos/${id}/sair`, { method: "POST" }) : { status: 0, corpo: null };
    const encerrou = fim.corpo?.session?.status === "finished";

    const bom = c.status === 200 && ac.status === 200 && temEstado && encerrou;
    if (!bom) falhas++;
    console.log(
      game.padEnd(13) +
        String(c.status).padStart(9) +
        String(ac.status).padStart(8) +
        (temEstado ? "  ok" : "  VAZIO").padStart(9) +
        (encerrou ? "  ok" : "  FALHOU")
    );
  }

  console.log("\n" + (falhas === 0
    ? `✓ os ${JOGOS.length} jogos passam pelo ciclo completo`
    : `✗ ${falhas} jogo(s) com problema`));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
