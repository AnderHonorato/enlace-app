import { requireUser, json, handle } from "@/nucleo/api";

export const runtime = "nodejs";

/**
 * Estações de rádio ao vivo, de graça, para tocar de fundo enquanto o casal
 * usa o app. Os dados vêm do Radio Browser, um diretório aberto e comunitário
 * de streams públicos — sem chave, sem cadastro.
 *
 * Só devolvemos stream em HTTPS. O app roda em HTTPS em produção, e o
 * navegador bloqueia áudio em HTTP dentro de página segura ("conteúdo
 * misto"): a estação simplesmente não tocaria, sem erro visível.
 */

type Estacao = { id: string; nome: string; stream: string; logo: string | null; tags: string[]; pais: string };

const CANAIS = [
  { chave: "brasil", rotulo: "Do Brasil", busca: { countrycode: "BR" } },
  { chave: "mpb", rotulo: "MPB", busca: { tag: "mpb" } },
  { chave: "romantica", rotulo: "Românticas", busca: { tag: "romantic" } },
  { chave: "jazz", rotulo: "Jazz & Bossa", busca: { tag: "bossa nova" } },
  { chave: "lofi", rotulo: "Lo-fi", busca: { tag: "lounge" } },
  { chave: "rock", rotulo: "Rock", busca: { tag: "classic rock" } },
] as const;

export type CanalRadio = (typeof CANAIS)[number]["chave"];

const cache = new Map<string, { valor: Estacao[]; ate: number }>();
const CACHE_MS = 60 * 60 * 1000;

export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const pedido = searchParams.get("canal") || "brasil";
    const canal = CANAIS.find((c) => c.chave === pedido) ?? CANAIS[0];

    const emCache = cache.get(canal.chave);
    if (emCache && emCache.ate > Date.now()) {
      return json({ canais: CANAIS.map((c) => ({ chave: c.chave, rotulo: c.rotulo })), estacoes: emCache.valor });
    }

    const params = new URLSearchParams({
      hidebroken: "true",
      order: "clickcount",
      reverse: "true",
      // Pedimos bem mais do que vamos usar porque boa parte cai fora no filtro
      // de HTTPS logo abaixo.
      limit: "60",
      ...(canal.busca as Record<string, string>),
    });

    let estacoes: Estacao[] = [];
    try {
      const res = await fetch(`https://de1.api.radio-browser.info/json/stations/search?${params}`, {
        headers: { "User-Agent": "Enlace/1.0" },
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const dados: any[] = await res.json();
        const vistos = new Set<string>();
        estacoes = dados
          .filter((s) => typeof s.url_resolved === "string" && s.url_resolved.startsWith("https://"))
          .filter((s) => {
            const nome = String(s.name || "").trim().toLowerCase();
            if (!nome || vistos.has(nome)) return false;
            vistos.add(nome);
            return true;
          })
          .slice(0, 14)
          .map((s) => ({
            id: String(s.stationuuid),
            nome: String(s.name).trim(),
            stream: String(s.url_resolved),
            logo: s.favicon && String(s.favicon).startsWith("https://") ? String(s.favicon) : null,
            tags: String(s.tags || "")
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
              .slice(0, 3),
            pais: String(s.country || ""),
          }));
      }
    } catch {
      // Diretório fora do ar: devolvemos lista vazia e a tela explica.
    }

    cache.set(canal.chave, { valor: estacoes, ate: Date.now() + CACHE_MS });

    return json({
      canais: CANAIS.map((c) => ({ chave: c.chave, rotulo: c.rotulo })),
      estacoes,
    });
  });
}
