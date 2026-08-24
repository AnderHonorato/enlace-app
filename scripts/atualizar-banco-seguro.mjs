import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function garantirColunaAgoraTocando() {
  const colunas = await prisma.$queryRawUnsafe('PRAGMA table_info("Couple")');
  const existe = colunas.some((coluna) => coluna.name === "nowPlaying");

  if (!existe) {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Couple" ADD COLUMN "nowPlaying" TEXT NOT NULL DEFAULT \'{}\'',
    );
  }
}

// Migração estritamente aditiva para instalações locais que possuem tabelas
// legadas. Diferente de `prisma db push`, este script nunca compara/removerá
// estruturas antigas: só cria o que esta versão passou a usar.
const statements = [
  `CREATE TABLE IF NOT EXISTS "ChatUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatUpload_coupleId_createdAt_idx"
    ON "ChatUpload"("coupleId", "createdAt")`,

  `CREATE TABLE IF NOT EXISTS "RabiscaRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sala de desenho',
    "theme" TEXT NOT NULL DEFAULT 'cotidiano',
    "mode" TEXT NOT NULL DEFAULT 'classico',
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "hostId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 5,
    "roundSeconds" INTEGER NOT NULL DEFAULT 80,
    "drawerId" TEXT,
    "word" TEXT,
    "result" TEXT NOT NULL DEFAULT '{}',
    "roundStartedAt" DATETIME,
    "pausedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RabiscaRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RabiscaRoom_code_key" ON "RabiscaRoom"("code")`,
  `CREATE INDEX IF NOT EXISTS "RabiscaRoom_status_updatedAt_idx" ON "RabiscaRoom"("status", "updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "RabiscaRoom_hostId_status_idx" ON "RabiscaRoom"("hostId", "status")`,

  `CREATE TABLE IF NOT EXISTS "RabiscaPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    CONSTRAINT "RabiscaPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RabiscaRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RabiscaPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RabiscaPlayer_roomId_userId_key" ON "RabiscaPlayer"("roomId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "RabiscaPlayer_roomId_score_idx" ON "RabiscaPlayer"("roomId", "score")`,
  `CREATE INDEX IF NOT EXISTS "RabiscaPlayer_userId_leftAt_idx" ON "RabiscaPlayer"("userId", "leftAt")`,

  `CREATE TABLE IF NOT EXISTS "RabiscaStroke" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "points" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RabiscaStroke_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RabiscaRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RabiscaStroke_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "RabiscaStroke_roomId_round_createdAt_idx"
    ON "RabiscaStroke"("roomId", "round", "createdAt")`,

  `CREATE TABLE IF NOT EXISTS "RabiscaGuess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "similarity" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RabiscaGuess_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RabiscaRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RabiscaGuess_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "RabiscaGuess_roomId_round_createdAt_idx"
    ON "RabiscaGuess"("roomId", "round", "createdAt")`,

  `CREATE INDEX IF NOT EXISTS "Message_coupleId_readAt_idx" ON "Message"("coupleId", "readAt")`,
  `CREATE INDEX IF NOT EXISTS "Entry_coupleId_visibility_entryDate_createdAt_idx"
    ON "Entry"("coupleId", "visibility", "entryDate", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Entry_authorId_entryDate_createdAt_idx"
    ON "Entry"("authorId", "entryDate", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Attachment_entryId_type_idx" ON "Attachment"("entryId", "type")`,
];

try {
  await garantirColunaAgoraTocando();
  await prisma.$transaction(async (database) => {
    for (const statement of statements) await database.$executeRawUnsafe(statement);
  });
  console.log("Banco atualizado com segurança. Nenhuma tabela ou registro foi removido.");
} catch (error) {
  console.error("Não foi possível aplicar a atualização aditiva do banco.");
  throw error;
} finally {
  await prisma.$disconnect();
}
