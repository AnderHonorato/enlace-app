import "server-only";
import { prisma } from "./prisma";

let tableReady: Promise<void> | null = null;

type ColunaSqlite = { name: string };

/**
 * Mantém a tabela de uploads compatível com instalações SQLite antigas sem
 * apagar arquivos existentes. Em PostgreSQL a estrutura deve ser aplicada por
 * migração/db push; o runtime não tenta executar PRAGMA ou ALTER específicos.
 */
export async function ensureChatUploadTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      const url = process.env.DATABASE_URL || "";
      const sqlite = url.startsWith("file:") || !/^(postgres|postgresql):/i.test(url);
      if (!sqlite) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatUpload" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "coupleId" TEXT NOT NULL,
          "uploaderId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "mime" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "data" BLOB NOT NULL,
          "storageProvider" TEXT NOT NULL DEFAULT 'database',
          "storageKey" TEXT,
          "category" TEXT NOT NULL DEFAULT 'chat',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const colunas = await prisma.$queryRaw<ColunaSqlite[]>`PRAGMA table_info("ChatUpload")`;
      const nomes = new Set(colunas.map((c) => c.name));
      if (!nomes.has("storageProvider")) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "ChatUpload" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'database'`
        );
      }
      if (!nomes.has("storageKey")) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "ChatUpload" ADD COLUMN "storageKey" TEXT`);
      }
      if (!nomes.has("category")) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "ChatUpload" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'chat'`
        );
      }

      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ChatUpload_coupleId_createdAt_idx" ON "ChatUpload"("coupleId", "createdAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ChatUpload_coupleId_category_createdAt_idx" ON "ChatUpload"("coupleId", "category", "createdAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ChatUpload_uploaderId_createdAt_idx" ON "ChatUpload"("uploaderId", "createdAt")`
      );
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}
