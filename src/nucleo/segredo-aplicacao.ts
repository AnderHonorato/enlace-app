import "server-only";

/**
 * Segredos separados por finalidade.
 *
 * `SESSION_SECRET` assina sessões e `DATA_ENCRYPTION_SECRET` cifra dados
 * sensíveis. `APP_SECRET` continua aceito como fallback de migração para não
 * derrubar instalações existentes; projetos novos devem usar as duas chaves
 * independentes.
 */
const DEV_SESSION_FALLBACK = "enlace-dev-session-secret";
const DEV_DATA_FALLBACK = "enlace-dev-data-secret";

let sessaoCache: string | null = null;
let dadosCache: string | null = null;

function exigirOuMigrar(nome: "SESSION_SECRET" | "DATA_ENCRYPTION_SECRET", fallbackDev: string): string {
  const especifico = process.env[nome]?.trim();
  if (especifico) return especifico;

  const legado = process.env.APP_SECRET?.trim();
  if (legado) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[Enlace] ${nome} ainda usa APP_SECRET como fallback. Defina uma chave exclusiva para concluir a separação de segredos.`);
    }
    return legado;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${nome} não definido. Gere uma chave aleatória forte (ex.: openssl rand -base64 48) antes de iniciar a aplicação.`
    );
  }

  console.warn(`[Enlace] ${nome} não definido — usando segredo apenas de desenvolvimento.`);
  return fallbackDev;
}

export function sessionSecret(): string {
  if (!sessaoCache) sessaoCache = exigirOuMigrar("SESSION_SECRET", DEV_SESSION_FALLBACK);
  return sessaoCache;
}

export function dataEncryptionSecret(): string {
  if (!dadosCache) dadosCache = exigirOuMigrar("DATA_ENCRYPTION_SECRET", DEV_DATA_FALLBACK);
  return dadosCache;
}

/**
 * Apenas para abrir registros cifrados antes da migração para o formato v2.
 * Quando APP_SECRET não existe, usa a chave de dados atual.
 */
export function legacyDataEncryptionSecret(): string {
  return process.env.APP_SECRET?.trim() || dataEncryptionSecret();
}

/** @deprecated Prefira sessionSecret() ou dataEncryptionSecret(). */
export function appSecret(): string {
  return sessionSecret();
}
