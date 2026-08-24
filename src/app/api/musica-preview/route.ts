import { requireUser, json, handle } from "@/nucleo/api";

export const runtime = "nodejs";

/**
 * Trecho de 30 segundos de uma música, para o jogo "Adivinhe a Música".
 *
 * Usa a busca do iTunes em vez do Spotify de propósito: o Spotify parou de
 * devolver `preview_url` para aplicativos novos (vem sempre nulo), então não dá
 * para tocar nada por lá. A busca do iTunes é aberta, não precisa de chave e
 * devolve um MP3/M4A de 30s — que é exatamente o que o jogo precisa.
 *
 * A chamada é feita no servidor (e não direto do navegador) para não depender
 * do CORS da Apple e para podermos guardar o resultado em cache: a lista de
 * músicas do jogo é fixa, então a mesma busca se repete muito.
 */

type Achado = { preview: string | null; capa: string | null; nome: string; artista: string };

const cache = new Map<string, { valor: Achado; ate: number }>();
const CACHE_MS = 12 * 60 * 60 * 1000; // 12h

/** Tira acento e pontuação para comparar títulos de forma tolerante. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const artista = (searchParams.get("artista") || "").trim().slice(0, 120);
    const titulo = (searchParams.get("titulo") || "").trim().slice(0, 120);
    if (!artista || !titulo) return json({ error: "Informe artista e título." }, 400);

    const chave = normalizar(`${artista} ${titulo}`);
    const emCache = cache.get(chave);
    if (emCache && emCache.ate > Date.now()) return json(emCache.valor);

    const url =
      "https://itunes.apple.com/search?media=music&entity=song&country=BR&limit=8&term=" +
      encodeURIComponent(`${artista} ${titulo}`);

    let achado: Achado = { preview: null, capa: null, nome: titulo, artista };

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Enlace/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const itens: any[] = data?.results ?? [];
        const alvo = normalizar(titulo);

        // Prefere a faixa cujo título bate; senão, a primeira que tenha prévia.
        // Sem isso, uma busca por "Flores" podia devolver qualquer coisa do
        // artista e o casal ouviria a música errada.
        const exata = itens.find((t) => t.previewUrl && normalizar(t.trackName || "") === alvo);
        const parecida = itens.find(
          (t) => t.previewUrl && normalizar(t.trackName || "").startsWith(alvo)
        );
        const qualquer = itens.find((t) => t.previewUrl);
        const t = exata || parecida || qualquer;

        if (t) {
          achado = {
            preview: t.previewUrl ?? null,
            capa: t.artworkUrl100 ? String(t.artworkUrl100).replace("100x100", "300x300") : null,
            nome: t.trackName || titulo,
            artista: t.artistName || artista,
          };
        }
      }
    } catch {
      // Sem internet ou iTunes fora do ar: o jogo continua só com as dicas.
    }

    cache.set(chave, { valor: achado, ate: Date.now() + CACHE_MS });
    return json(achado);
  });
}
