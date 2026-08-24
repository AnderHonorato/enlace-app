import "server-only";
import { prisma } from "./prisma";

let tableReady: Promise<void> | null = null;

/**
 * O projeto ainda usa `prisma db push`, sem pasta de migrations. Criar a
 * tabela de forma idempotente mantém instalações existentes funcionando já
 * no primeiro upload depois do deploy, sem apagar nem reescrever dados.
 */
export async function ensureChatUploadTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatUpload" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "coupleId" TEXT NOT NULL,
          "uploaderId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "mime" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "data" BLOB NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ChatUpload_coupleId_createdAt_idx" ON "ChatUpload"("coupleId", "createdAt")`
      );
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}
