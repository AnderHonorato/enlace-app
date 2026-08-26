import "server-only";
import { decryptSecret } from "./criptografia";
import { isProvider, type AIProvider } from "./ia";

const PROVIDER_KEYS: AIProvider[] = ["openai", "deepseek", "anthropic"];

type UsuarioComIA = {
  aiProvider?: string | null;
  aiKeyOpenai?: string | null;
  aiKeyDeepseek?: string | null;
  aiKeyAnthropic?: string | null;
};

function keyForProvider(user: UsuarioComIA, provider: AIProvider): string {
  const dbField =
    provider === "openai"
      ? user.aiKeyOpenai
      : provider === "deepseek"
      ? user.aiKeyDeepseek
      : user.aiKeyAnthropic;
  const dbKey = decryptSecret(dbField);
  if (dbKey) return dbKey;

  const envKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY
      : provider === "deepseek"
      ? process.env.DEEPSEEK_API_KEY
      : process.env.ANTHROPIC_API_KEY;
  return (envKey || "").trim();
}

// Resolve a chave de IA: primeiro a do usuário (no banco, criptografada);
// se não houver, usa uma chave global do ambiente (.env) como fallback.
// Se o provedor escolhido não tiver chave, tenta outros provedores.
export function resolveApiKey(user: UsuarioComIA, provider: AIProvider): string {
  return keyForProvider(user, provider) || resolveAnyKey(user);
}

/** Resolve qualquer chave de IA disponível (fallback entre provedores). */
export function resolveAnyKey(user: UsuarioComIA): string {
  for (const p of PROVIDER_KEYS) {
    const key = keyForProvider(user, p);
    if (key) return key;
  }
  return "";
}

/** Encontra o provedor que tem chave, ou retorna o escolhido pelo usuário. */
export function resolveProvider(user: UsuarioComIA): { provider: AIProvider; apiKey: string } {
  const preferred = selectedProvider(user);
  const key = keyForProvider(user, preferred);
  if (key) return { provider: preferred, apiKey: key };
  for (const p of PROVIDER_KEYS) {
    const k = keyForProvider(user, p);
    if (k) return { provider: p, apiKey: k };
  }
  return { provider: "openai", apiKey: "" };
}

export function selectedProvider(user: UsuarioComIA): AIProvider {
  const provider = user.aiProvider;
  return typeof provider === "string" && isProvider(provider) ? provider : "openai";
}

export function userHasKey(user: UsuarioComIA): boolean {
  return !!resolveAnyKey(user);
}
