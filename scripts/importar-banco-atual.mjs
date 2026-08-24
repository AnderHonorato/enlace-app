import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir, open, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const caminhoInformado = process.argv[2];
const raiz = process.cwd();
const destino = process.env.ENLACE_DB_DESTINO
  ? path.resolve(process.env.ENLACE_DB_DESTINO)
  : path.join(raiz, "prisma", "dev.db");
const pastaBackups = process.env.ENLACE_PASTA_BACKUPS
  ? path.resolve(process.env.ENLACE_PASTA_BACKUPS)
  : path.join(raiz, "backups");
const tabelasObrigatorias = ["User", "Couple", "Entry", "Message"];

function encerrar(mensagem) {
  console.error(mensagem);
  console.error('Uso: npm run db:importar -- "C:\\caminho\\antigo\\prisma\\dev.db"');
  process.exit(1);
}

function dataParaArquivo() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function urlDoSqlite(caminho) {
  return `file:${caminho.replaceAll("\\", "/")}`;
}

async function validarAssinatura(caminho) {
  const arquivo = await open(caminho, "r");
  try {
    const cabecalho = Buffer.alloc(16);
    await arquivo.read(cabecalho, 0, 16, 0);
    if (cabecalho.toString("utf8") !== "SQLite format 3\0") {
      throw new Error("o arquivo informado não possui uma assinatura SQLite válida");
    }
  } finally {
    await arquivo.close();
  }
}

async function validarEstrutura(caminho) {
  const cliente = new PrismaClient({ datasources: { db: { url: urlDoSqlite(caminho) } } });

  try {
    await cliente.$queryRawUnsafe("PRAGMA wal_checkpoint(FULL)");
    const tabelas = await cliente.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const nomes = new Set(tabelas.map((tabela) => tabela.name));
    const ausentes = tabelasObrigatorias.filter((tabela) => !nomes.has(tabela));

    if (ausentes.length) {
      throw new Error(`faltam tabelas essenciais: ${ausentes.join(", ")}`);
    }

    const [usuarios] = await cliente.$queryRawUnsafe('SELECT COUNT(*) AS total FROM "User"');
    const [memorias] = await cliente.$queryRawUnsafe('SELECT COUNT(*) AS total FROM "Entry"');
    return { usuarios: Number(usuarios.total), memorias: Number(memorias.total) };
  } finally {
    await cliente.$disconnect();
  }
}

if (!caminhoInformado) encerrar("Informe o caminho completo do banco atual.");

const origem = path.resolve(caminhoInformado);
if (origem === destino) encerrar("O banco informado já é o banco deste projeto.");

try {
  const informacoes = await stat(origem);
  if (!informacoes.isFile()) encerrar("O caminho informado não aponta para um arquivo.");
} catch {
  encerrar(`Banco não encontrado: ${origem}`);
}

await validarAssinatura(origem);
const antes = await validarEstrutura(origem);
await mkdir(pastaBackups, { recursive: true });

let backup = null;
try {
  const atual = await stat(destino);
  if (atual.isFile()) {
    backup = path.join(pastaBackups, `banco-antes-da-importacao-${dataParaArquivo()}.db`);
    await copyFile(destino, backup);
  }
} catch {
  // A primeira instalação ainda não possui banco de destino.
}

try {
  await copyFile(origem, destino);

  const atualizacao = spawnSync(process.execPath, [path.join(raiz, "scripts", "atualizar-banco-seguro.mjs")], {
    cwd: raiz,
    env: { ...process.env, DATABASE_URL: urlDoSqlite(destino) },
    stdio: "inherit",
  });

  if (atualizacao.status !== 0) throw new Error("a atualização aditiva do banco falhou");

  const depois = await validarEstrutura(destino);
  if (antes.usuarios !== depois.usuarios || antes.memorias !== depois.memorias) {
    throw new Error("a contagem de usuários ou memórias mudou durante a importação");
  }

  console.log(`Banco importado: ${depois.usuarios} usuário(s) e ${depois.memorias} memória(s).`);
  if (backup) console.log(`Backup anterior preservado em: ${backup}`);
} catch (erro) {
  const falho = path.join(pastaBackups, `importacao-com-falha-${dataParaArquivo()}.db`);
  try {
    await copyFile(destino, falho);
  } catch {
    // Não há arquivo parcial para preservar.
  }

  if (backup) await copyFile(backup, destino);
  else {
    try {
      await unlink(destino);
    } catch {
      // O destino não chegou a ser criado.
    }
  }

  console.error("A importação foi desfeita; nenhum banco anterior foi perdido.");
  throw erro;
}
