import "server-only";

/**
 * Limitador de tentativas em memória, para as rotas que conferem segredo:
 * login, PIN do cofre e troca de senha.
 *
 * Sem isso, um PIN de 4 dígitos (10 mil combinações) cai em minutos: dá para
 * mandar milhares de requisições seguidas e o servidor responde a todas.
 *
 * É em memória de propósito — o app roda em um processo só e não temos Redis.
 * Se um dia virar várias instâncias, isso vira um limite por instância (ainda
 * ajuda, mas aí vale trocar por algo compartilhado).
 */

type Bucket = { count: number; resetAt: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

/** Limpa buckets vencidos de vez em quando para o mapa não crescer sem fim. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) {
    if (b.resetAt < now && b.blockedUntil < now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Segundos até poder tentar de novo (0 quando ok). */
  retryAfter: number;
  /** Tentativas restantes na janela atual. */
  remaining: number;
};

/**
 * Consome uma tentativa. Quando o limite estoura, bloqueia pelo tempo de
 * `blockMs` — e cada nova tentativa durante o bloqueio NÃO estende a punição
 * (senão um ataque contínuo tranca o dono da conta para sempre).
 */
export function rateLimit(
  key: string,
  { limit = 8, windowMs = 60_000, blockMs = 5 * 60_000 } = {}
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

/** Zera o contador — chame quando a tentativa der certo. */
export function rateLimitReset(key: string) {
  buckets.delete(key);
}

/**
 * Identifica quem está tentando. Usa o IP dos cabeçalhos de proxy quando
 * existirem; sem eles todo mundo cai no mesmo balde, então sempre combine com
 * algo por usuário/e-mail no `key`.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "local";
}

/** Mensagem em português com o tempo de espera. */
export function tooManyMessage(retryAfter: number): string {
  if (retryAfter >= 60) {
    const min = Math.ceil(retryAfter / 60);
    return `Muitas tentativas. Tente de novo em ${min} minuto${min > 1 ? "s" : ""}.`;
  }
  return `Muitas tentativas. Tente de novo em ${retryAfter} segundos.`;
}
