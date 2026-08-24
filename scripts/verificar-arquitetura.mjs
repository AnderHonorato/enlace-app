import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const raiz = process.cwd();
const pastas = ["src", "scripts"];
const extensoes = new Set([".ts", ".tsx", ".css", ".mjs"]);
const limiteAviso = 600;
const limiteBytes = 512 * 1024;

async function listarArquivos(pasta) {
  const itens = await readdir(pasta, { withFileTypes: true });
  const caminhos = [];

  for (const item of itens) {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) caminhos.push(...(await listarArquivos(caminho)));
    else if (extensoes.has(path.extname(item.name))) caminhos.push(caminho);
  }

  return caminhos;
}

const arquivos = (await Promise.all(pastas.map((pasta) => listarArquivos(path.join(raiz, pasta))))).flat();
const grandes = [];

for (const arquivo of arquivos) {
  const linhas = (await readFile(arquivo, "utf8")).split(/\r?\n/).length;
  if (linhas > limiteAviso) grandes.push({ arquivo: path.relative(raiz, arquivo), linhas });
}

async function listarTodosOsArquivos(pasta) {
  const itens = await readdir(pasta, { withFileTypes: true });
  const caminhos = [];

  for (const item of itens) {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) caminhos.push(...(await listarTodosOsArquivos(caminho)));
    else caminhos.push(caminho);
  }

  return caminhos;
}

const todosOsArquivos = (
  await Promise.all(pastas.map((pasta) => listarTodosOsArquivos(path.join(raiz, pasta))))
).flat();
const pesados = [];

for (const arquivo of todosOsArquivos) {
  const tamanho = (await stat(arquivo)).size;
  if (tamanho > limiteBytes) pesados.push({ arquivo: path.relative(raiz, arquivo), tamanho });
}

grandes.sort((a, b) => b.linhas - a.linhas);

if (grandes.length || pesados.length) {
  console.error(`Arquivos acima do limite de ${limiteAviso} linhas:`);
  for (const item of grandes) console.error(`- ${item.arquivo}: ${item.linhas} linhas`);
  for (const item of pesados) console.error(`- ${item.arquivo}: ${Math.ceil(item.tamanho / 1024)} KB`);
  process.exitCode = 1;
} else {
  console.log(`Arquitetura aprovada: nenhum arquivo acima de ${limiteAviso} linhas.`);
}
