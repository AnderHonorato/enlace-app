import { PrismaClient } from "@prisma/client";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const raiz = process.cwd();
const pasta = await mkdtemp(path.join(os.tmpdir(), "enlace-importacao-"));
const legado = path.join(pasta, "legado.db");
const destino = path.join(pasta, "importado.db");
const url = (arquivo) => `file:${arquivo.replaceAll("\\", "/")}`;

function executar(comando, argumentos, ambiente = {}) {
  const resultado = spawnSync(comando, argumentos, {
    cwd: raiz,
    env: { ...process.env, ...ambiente },
    encoding: "utf8",
  });

  if (resultado.status !== 0) {
    throw new Error([resultado.stdout, resultado.stderr].filter(Boolean).join("\n"));
  }

  return resultado.stdout;
}

try {
  const banco = new PrismaClient({ datasources: { db: { url: url(legado) } } });
  await banco.$executeRawUnsafe(`CREATE TABLE "Couple" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL UNIQUE,
    "typing" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await banco.$executeRawUnsafe(`CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "coupleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await banco.$executeRawUnsafe(`CREATE TABLE "Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "coupleId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'shared',
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await banco.$executeRawUnsafe(`CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await banco.$executeRawUnsafe(`CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image'
  )`);

  await banco.$executeRawUnsafe('INSERT INTO "Couple" ("id", "inviteCode") VALUES (\'casal-teste\', \'TESTE1\')');
  await banco.$executeRawUnsafe(`INSERT INTO "User" ("id", "email", "name", "passwordHash", "coupleId")
    VALUES ('usuario-teste', 'teste-importacao@enlace.local', 'Teste de importação', 'nao-utilizado', 'casal-teste')`);
  await banco.$executeRawUnsafe(`INSERT INTO "Entry" ("id", "authorId", "coupleId", "title", "content")
    VALUES ('memoria-teste', 'usuario-teste', 'casal-teste', 'Memória preservada', 'Conteúdo de verificação')`);
  await banco.$executeRawUnsafe(`INSERT INTO "Message" ("id", "coupleId", "senderId", "content")
    VALUES ('mensagem-teste', 'casal-teste', 'usuario-teste', 'Mensagem preservada')`);
  await banco.$disconnect();

  const saida = executar(
    process.execPath,
    [path.join(raiz, "scripts", "importar-banco-atual.mjs"), legado],
    { ENLACE_DB_DESTINO: destino, ENLACE_PASTA_BACKUPS: path.join(pasta, "backups") },
  );

  const importado = new PrismaClient({ datasources: { db: { url: url(destino) } } });
  const [memoria] = await importado.$queryRawUnsafe('SELECT "id" FROM "Entry" WHERE "id" = \'memoria-teste\'');
  const [mensagem] = await importado.$queryRawUnsafe('SELECT "id" FROM "Message" WHERE "id" = \'mensagem-teste\'');
  const [casal] = await importado.$queryRawUnsafe('SELECT "nowPlaying" FROM "Couple" WHERE "id" = \'casal-teste\'');
  await importado.$disconnect();

  if (!memoria || !mensagem || casal?.nowPlaying !== "{}") {
    throw new Error("a validação final não encontrou todos os dados esperados");
  }

  process.stdout.write(saida);
  console.log("Teste aprovado: banco legado importado sem perder memória ou mensagem.");
} finally {
  await rm(pasta, { recursive: true, force: true });
}
