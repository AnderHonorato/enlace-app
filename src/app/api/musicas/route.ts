import { requireUser, json, handle } from "@/nucleo/api";
import catalogo, { type FaixaCatalogo } from "@/dados/musicas";

export const runtime = "nodejs";

/**
 * Rodada do "Adivinhe a Música".
 *
 * O catálogo tem milhares de faixas e mora só no servidor: são ~3 MB, que não
 * fazem sentido baixar para o navegador só para sortear 30 músicas.
 *
 * O sorteio é enviesado para as mais conhecidas. `r` é a posição em que a faixa
 * apareceu na busca do artista, e a Apple devolve as mais tocadas primeiro —
 * então `r` baixo é hit e `r` alto é lado B. Sem esse viés o jogo sorteava
 * gravação ao vivo de 1987 que ninguém reconhece, e adivinhar virava sorte.
 */

const FAIXAS = catalogo;

/** Até esta posição consideramos "hit do artista". */
const LIMITE_HIT = 15;
/** Fatia da rodada que vem dos hits. O resto entra para variar o repertório. */
const PROPORCAO_HITS = 0.75;

const HITS = FAIXAS.filter((f) => f.r <= LIMITE_HIT);
const RESTO = FAIXAS.filter((f) => f.r > LIMITE_HIT);

function sortear(lista: FaixaCatalogo[], quantidade: number, usados: Set<string>): FaixaCatalogo[] {
  const escolhidas: FaixaCatalogo[] = [];
  let tentativas = 0;
  while (escolhidas.length < quantidade && tentativas < quantidade * 40) {
    tentativas++;
    const f = lista[Math.floor(Math.random() * lista.length)];
    if (!f) break;
    const chave = `${f.a}|${f.t}`;
    if (usados.has(chave)) continue;
    usados.add(chave);
    escolhidas.push(f);
  }
  return escolhidas;
}

export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const pedido = Number(searchParams.get("n") ?? 30);
    const quantidade = Math.min(60, Math.max(5, Number.isFinite(pedido) ? pedido : 30));

    const usados = new Set<string>();
    const doHits = sortear(HITS, Math.round(quantidade * PROPORCAO_HITS), usados);
    const doResto = sortear(RESTO, quantidade - doHits.length, usados);

    // Embaralha para os hits não virem todos no começo da rodada.
    const rodada = [...doHits, ...doResto];
    for (let i = rodada.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rodada[i], rodada[j]] = [rodada[j], rodada[i]];
    }

    return json({
      total: FAIXAS.length,
      musicas: rodada.map((f) => ({
        artista: f.a,
        titulo: f.t,
        ano: f.y,
        genero: f.g,
        preview: f.p,
        capa: f.c,
      })),
    });
  });
}
