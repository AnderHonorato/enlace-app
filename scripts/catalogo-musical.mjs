import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const pastaCatalogo = path.join(process.cwd(), "src", "dados", "musicas");
const arquivoLegado = path.join(process.cwd(), "src", "dados", "musicas.json");
const quantidadePorParte = 250;

function nomeDaParte(indice) {
  return `parte-${String(indice + 1).padStart(3, "0")}.json`;
}

export async function lerCatalogoMusical() {
  try {
    const nomes = (await readdir(pastaCatalogo))
      .filter((nome) => /^parte-\d+\.json$/.test(nome))
      .sort();

    if (nomes.length) {
      const partes = await Promise.all(
        nomes.map(async (nome) => JSON.parse(await readFile(path.join(pastaCatalogo, nome), "utf8")))
      );
      return partes.flat();
    }
  } catch {}

  try {
    return JSON.parse(await readFile(arquivoLegado, "utf8"));
  } catch {
    return [];
  }
}

export async function salvarCatalogoMusical(musicas) {
  await mkdir(pastaCatalogo, { recursive: true });

  const antigos = (await readdir(pastaCatalogo)).filter((nome) => /^parte-\d+\.json$/.test(nome));
  await Promise.all(antigos.map((nome) => unlink(path.join(pastaCatalogo, nome))));

  const partes = [];
  for (let inicio = 0; inicio < musicas.length; inicio += quantidadePorParte) {
    partes.push(musicas.slice(inicio, inicio + quantidadePorParte));
  }

  await Promise.all(
    partes.map((parte, indice) =>
      writeFile(path.join(pastaCatalogo, nomeDaParte(indice)), `${JSON.stringify(parte)}\n`, "utf8")
    )
  );

  const importacoes = partes.map(
    (_, indice) => `import parte${indice + 1} from "./${nomeDaParte(indice)}";`
  );
  const referencias = partes.map((_, indice) => `...parte${indice + 1}`);
  const indice = [
    ...importacoes,
    "",
    "export type FaixaCatalogo = {",
    "  a: string;",
    "  t: string;",
    "  y: number | null;",
    "  g: string | null;",
    "  p: string;",
    "  c: string | null;",
    "  r: number;",
    "};",
    "",
    `const catalogoMusical = [${referencias.join(", ")}] as FaixaCatalogo[];`,
    "",
    "export default catalogoMusical;",
    "",
  ].join("\n");

  await writeFile(path.join(pastaCatalogo, "index.ts"), indice, "utf8");
  return partes.length;
}
