import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { distanciaEmMetros } from "./trajeto-localizacao";

const INTERVALO_MOVIMENTO_MS = 30_000;
const INTERVALO_PARADO_MS = 2 * 60_000;
const MOVIMENTO_MINIMO_METROS = 10;
let tabelasProntas: Promise<void> | null = null;

function nomesDeAdministrador() {
  return ["ander", "anderson", "anderson honorato"];
}

/** Cria apenas estruturas aditivas, preservando bancos já existentes. */
export async function garantirHistoricoLocalizacao() {
  if (!tabelasProntas) {
    tabelasProntas = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AdministradorAplicativo" (
          "userId" TEXT NOT NULL PRIMARY KEY,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AdministradorAplicativo_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PontoLocalizacao" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "lat" REAL NOT NULL,
          "lng" REAL NOT NULL,
          "precisao" REAL,
          "registradoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PontoLocalizacao_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "PontoLocalizacao_userId_registradoEm_idx"
          ON "PontoLocalizacao"("userId", "registradoEm")`,
      );

      const emailAdministrador = process.env.ENLACE_ADMIN_EMAIL?.trim().toLowerCase();
      if (emailAdministrador) {
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO "AdministradorAplicativo" ("userId")
          SELECT "id" FROM "User" WHERE lower("email") = ${emailAdministrador}
            AND NOT EXISTS (SELECT 1 FROM "AdministradorAplicativo")
          LIMIT 1
        `;
      } else {
        const nomes = nomesDeAdministrador();
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO "AdministradorAplicativo" ("userId")
          SELECT "id" FROM "User"
          WHERE (
            lower(trim("name")) IN (${nomes[0]}, ${nomes[1]}, ${nomes[2]})
            OR lower(trim(COALESCE("displayName", ''))) = ${nomes[0]}
          )
            AND NOT EXISTS (SELECT 1 FROM "AdministradorAplicativo")
          ORDER BY "createdAt" ASC
          LIMIT 1
        `;
      }
    })().catch((erro) => {
      tabelasProntas = null;
      throw erro;
    });
  }
  await tabelasProntas;
}

export async function usuarioEhAdministrador(userId: string) {
  await garantirHistoricoLocalizacao();
  return Boolean(
    await prisma.administradorAplicativo.findUnique({
      where: { userId },
      select: { userId: true },
    }),
  );
}

export async function registrarPontoLocalizacao({
  userId,
  lat,
  lng,
  precisao,
}: {
  userId: string;
  lat: number;
  lng: number;
  precisao?: number;
}) {
  await garantirHistoricoLocalizacao();
  const ultimo = await prisma.pontoLocalizacao.findFirst({
    where: { userId },
    orderBy: { registradoEm: "desc" },
    select: { lat: true, lng: true, registradoEm: true },
  });

  const agora = new Date();
  if (ultimo) {
    const decorrido = agora.getTime() - ultimo.registradoEm.getTime();
    if (decorrido < INTERVALO_MOVIMENTO_MS) return false;
    const distancia = distanciaEmMetros(ultimo, { lat, lng });
    if (distancia < MOVIMENTO_MINIMO_METROS && decorrido < INTERVALO_PARADO_MS) return false;
  }

  await prisma.pontoLocalizacao.create({
    data: {
      id: randomUUID(),
      userId,
      lat,
      lng,
      precisao: Number.isFinite(precisao) ? precisao : null,
      registradoEm: agora,
    },
  });
  return true;
}
