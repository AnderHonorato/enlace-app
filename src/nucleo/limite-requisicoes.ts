import "server-only";
import { isIP } from "node:net";

/**
 * Limitador de tentativas para rotas sensíveis. Em desenvolvimento ou numa
 * instalação de processo único usa memória; em produção pode usar um Redis
 * compatível com a API REST da Upstash sem adicionar dependência ao bundle.
 */

type Bucket = { count: number; resetAt: number; blockedUntil: number };
type Options = { limit?: number; windowMs?: number; blockMs?: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) {
    if (b.resetAt < now && b.blockedUntil < now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  retryAfter: number;
  remaining: number;
};

export function rateLimit(
  key: string,
  { limit = 8, windowMs = 60_000, blockMs = 5 * 60_000 }: Options = {}
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let b = buckets.get(key);
  if (!b) {
    b = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
    buckets.set(key, b);
  }

  if (b.blockedUntil > now) {
    return { ok: false, retryAfter: Math.ceil((b.blockedUntil - now) / 1000), remaining: 0 };
  }

  if (b.resetAt <= now) {
    b.count = 0;
    b.resetAt = now + windowMs;
  }

  b.count++;
  if (b.count > limit) {
    b.blockedUntil = now + blockMs;
    b.count = 0;
    b.resetAt = now + windowMs;
    return { ok: false, retryAfter: Math.ceil(blockMs / 1000), remaining: 0 };
  }

  return { ok: true, retryAfter: 0, remaining: limit - b.count };
}

export function rateLimitReset(key: string) {
  buckets.delete(key);
}

const SCRIPT_LIMITE = `
local value = redis.call('GET', KEYS[1])
if value == 'blocked' then
  local ttl = redis.call('PTTL', KEYS[1])
  return {0, 0, ttl}
end
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if count > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[1], 'blocked', 'PX', ARGV[3])
  return {0, 0, tonumber(ARGV[3])}
end
local ttl = redis.call('PTTL', KEYS[1])
return {1, tonumber(ARGV[2]) - count, ttl}
`;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("Redis distribuído não configurado.");
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) throw new Error(`Redis respondeu ${response.status}.`);
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

/**
 * Versão distribuída. Quando Redis não foi configurado (ou fica indisponível),
 * cai para o limite local em vez de liberar tentativas sem proteção.
 */
export async function rateLimitSecure(key: string, options: Options = {}): Promise<RateLimitResult> {
  const { limit = 8, windowMs = 60_000, blockMs = 5 * 60_000 } = options;
  if (!redisConfig()) return rateLimit(key, options);

  try {
    const result = await redisCommand([
      "EVAL",
      SCRIPT_LIMITE,
      1,
      `enlace:limite:${key}`,
      String(windowMs),
      String(limit),
      String(blockMs),
    ]);
    if (!Array.isArray(result) || result.length < 3) throw new Error("Resposta de limite inválida.");
    const [ok, remaining, ttlMs] = result.map(Number);
    return {
      ok: ok === 1,
      remaining: Math.max(0, remaining || 0),
      retryAfter: ok === 1 ? 0 : Math.max(1, Math.ceil((ttlMs || blockMs) / 1000)),
    };
  } catch (error) {
    console.warn("[Enlace] limite distribuído indisponível; usando proteção local.", error instanceof Error ? error.message : "erro");
    return rateLimit(key, options);
  }
}

export async function rateLimitResetSecure(key: string) {
  rateLimitReset(key);
  if (!redisConfig()) return;
  try {
    await redisCommand(["DEL", `enlace:limite:${key}`]);
  } catch {
    // O contador local já foi limpo. Uma falha remota só mantém um limite mais
    // conservador até o TTL expirar, nunca libera tentativas extras.
  }
}

function ipValido(value: string | null): string | null {
  if (!value) return null;
  const clean = value.trim().replace(/^\[|\]$/g, "");
  return isIP(clean) ? clean : null;
}

/**
 * Usa cabeçalhos de provedores que substituem o valor na borda. O genérico
 * x-forwarded-for só é aceito quando TRUST_PROXY_HEADERS=true, evitando que um
 * cliente comum escolha o próprio IP e contorne o limite.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  const trusted =
    ipValido(h.get("cf-connecting-ip")) ||
    ipValido(h.get("x-real-ip")) ||
    ipValido(h.get("x-vercel-forwarded-for")?.split(",")[0] ?? null);
  if (trusted) return trusted;

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = ipValido(h.get("x-forwarded-for")?.split(",")[0] ?? null);
    if (forwarded) return forwarded;
  }
  return "desconhecido";
}

export function tooManyMessage(retryAfter: number): string {
  if (retryAfter >= 60) {
    const min = Math.ceil(retryAfter / 60);
    return `Muitas tentativas. Tente de novo em ${min} minuto${min > 1 ? "s" : ""}.`;
  }
  return `Muitas tentativas. Tente de novo em ${retryAfter} segundos.`;
}
