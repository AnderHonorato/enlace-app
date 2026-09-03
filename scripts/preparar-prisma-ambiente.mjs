import fs from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const databaseUrl = (process.env.DATABASE_URL || "").trim();

if (process.env.VERCEL === "1" && !databaseUrl) {
  console.error("[Only Nós] DATABASE_URL não foi configurada na Vercel.");
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`[Only Nós] Schema Prisma não encontrado em ${schemaPath}.`);
  process.exit(1);
}

const isPostgres = /^(postgresql|postgres):\/\//i.test(databaseUrl);
const isSqlite = /^file:/i.test(databaseUrl);

if (!databaseUrl) {
  console.log("[Only Nós] DATABASE_URL não está exportada para o processo; mantendo o provider atual do Prisma.");
  process.exit(0);
}

if (!isPostgres && !isSqlite) {
  console.error("[Only Nós] DATABASE_URL usa um formato não suportado. Use PostgreSQL ou SQLite.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");
const provider = isPostgres ? "postgresql" : "sqlite";

schema = schema.replace(
  /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+("[\s\S]*?\})/m,
  `$1${provider}$2`,
);

fs.writeFileSync(schemaPath, schema, "utf8");
console.log(`[Only Nós] Prisma preparado para ${provider}.`);
