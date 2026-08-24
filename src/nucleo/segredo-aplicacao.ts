import "server-only";

/**
 * Segredo da aplicação — assina a sessão (JWT) e deriva a chave que cifra as
 * chaves de IA dos usuários em repouso.
 *
 * Antes, os dois usos caíam silenciosamente para a string "amora-dev-secret"
 * quando a variável não estava definida. Essa string está no repositório: se o
 * APP_SECRET não chegasse ao ambiente por um erro de deploy, qualquer pessoa
 * poderia forjar a sessão de qualquer usuário e decifrar as chaves salvas —
 * e nada no app avisaria. Em produção agora isso é uma falha explícita.
 */
const DEV_FALLBACK = "amora-dev-secret";

let cached: string | null = null;

export function appSecret(): string {
  if (cached) return cached;

  const fromEnv = process.env.APP_SECRET?.trim();
  if (fromEnv) {
    cached = fromEnv;
    return cached;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "APP_SECRET não definido. Ele assina as sessões e cifra as chaves de IA — " +
        "a aplicação não pode subir em produção sem ele. " +
        "Gere um valor aleatório (ex.: `openssl rand -base64 32`) e defina APP_SECRET."
    );
  }

  // Em desenvolvimento seguimos com o fallback, mas avisando alto.
  console.warn(
    "[Enlace] APP_SECRET não definido — usando segredo de desenvolvimento. " +
      "NUNCA use isso em produção."
  );
  cached = DEV_FALLBACK;
  return cached;
}
