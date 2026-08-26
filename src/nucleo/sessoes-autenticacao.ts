import "server-only";
import { prisma } from "./prisma";

const INATIVIDADE_MS = 14 * 24 * 60 * 60 * 1000;
const TOQUE_MS = 10 * 60 * 1000;
let tabelaPronta: Promise<void> | null = null;

/** Cria a tabela de sessões de forma aditiva para bancos existentes. */
export async function ensureAuthSessionTable(): Promise<void> {
  if (!tabelaPronta) {
    tabelaPronta = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuthSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastSeenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP NOT NULL,
          "revokedAt" TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt")`
      );
    })().catch((error) => {
      tabelaPronta = null;
      throw error;
    });
  }
  await tabelaPronta;
}

export async function criarSessaoRevogavel(userId: string, expiresAt: Date) {
  await ensureAuthSessionTable();
  return prisma.authSession.create({
    data: { userId, expiresAt },
    select: { id: true },
  });
}

export async function sessaoEstaAtiva(sessionId: string, userId: string): Promise<boolean> {
  await ensureAuthSessionTable();
  const sessao = await prisma.authSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, lastSeenAt: true, expiresAt: true, revokedAt: true },
  });
  if (!sessao || sessao.revokedAt) return false;

  const agora = Date.now();
  if (sessao.expiresAt.getTime() <= agora || agora - sessao.lastSeenAt.getTime() > INATIVIDADE_MS) {
    await prisma.authSession.update({
      where: { id: sessao.id },
      data: { revokedAt: new Date() },
    }).catch(() => {});
    return false;
  }

  if (agora - sessao.lastSeenAt.getTime() > TOQUE_MS) {
    await prisma.authSession.update({
      where: { id: sessao.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});
  }
  return true;
}

export async function revogarSessao(sessionId: string | null | undefined) {
  if (!sessionId) return;
  await ensureAuthSessionTable();
  await prisma.authSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revogarTodasSessoes(userId: string) {
  await ensureAuthSessionTable();
  return prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function listarSessoesAtivas(userId: string) {
  await ensureAuthSessionTable();
  const limiteInatividade = new Date(Date.now() - INATIVIDADE_MS);
  return prisma.authSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      lastSeenAt: { gt: limiteInatividade },
    },
    select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    orderBy: { lastSeenAt: "desc" },
  });
}
