import { unlink } from "node:fs/promises";
import path from "node:path";
import { lerCatalogoMusical, salvarCatalogoMusical } from "./catalogo-musical.mjs";

const arquivoLegado = path.join(process.cwd(), "src", "dados", "musicas.json");
const musicas = await lerCatalogoMusical();

if (!musicas.length) {
  throw new Error("O catálogo musical está vazio; o arquivo original foi mantido.");
}

const quantidadeDePartes = await salvarCatalogoMusical(musicas);
const catalogoConferido = await lerCatalogoMusical();

if (catalogoConferido.length !== musicas.length) {
  throw new Error("A conferência do catálogo dividido falhou; o arquivo original foi mantido.");
}

await unlink(arquivoLegado).catch(() => {});
console.log(`${musicas.length} músicas preservadas em ${quantidadeDePartes} partes.`);
