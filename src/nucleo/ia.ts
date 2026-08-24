// Cliente unificado de IA — GPT (OpenAI), DeepSeek e Claude (Anthropic).
// Sem SDKs: usa fetch direto para manter o bundle leve.

export type AIProvider = "openai" | "deepseek" | "anthropic";

export type AIMessage = { role: "user" | "assistant"; content: string };

export const PROVIDERS: Record<
  AIProvider,
  { label: string; models: string[]; defaultModel: string; keyHint: string; keyUrl: string }
> = {
  openai: {
    label: "OpenAI (GPT)",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    defaultModel: "gpt-4o-mini",
    keyHint: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  deepseek: {
    label: "DeepSeek",
    models: ["deepseek-v4-pro", "deepseek-v4-flash"],
    defaultModel: "deepseek-v4-flash",
    keyHint: "sk-...",
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    models: ["claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5"],
    defaultModel: "claude-haiku-4-5",
    keyHint: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

const MODEL_ALIASES: Record<string, string> = {
  // nomes antigos da API da DeepSeek
  "deepseek-chat": "deepseek-v4-flash",
  "deepseek-reasoner": "deepseek-v4-pro",
  "deepseek-flash": "deepseek-v4-flash",
  // modelos da Anthropic que saíram de linha
  "claude-3-5-haiku-latest": "claude-haiku-4-5",
  "claude-3-5-sonnet-latest": "claude-sonnet-5",
  "claude-3-7-sonnet-latest": "claude-sonnet-5",
};

export function resolveModel(provider: AIProvider, model?: string | null): string {
  if (model && MODEL_ALIASES[model]) return MODEL_ALIASES[model];
  // Um modelo salvo de outro provedor não serve aqui — cai no padrão.
  if (model && !PROVIDERS[provider].models.includes(model)) {
    return PROVIDERS[provider].defaultModel;
  }
  return model || PROVIDERS[provider].defaultModel;
}

export function isProvider(v: string): v is AIProvider {
  return v === "openai" || v === "deepseek" || v === "anthropic";
}

/**
 * Modelos que "pensam" antes de responder. O raciocínio consome o mesmo
 * orçamento de `max_tokens` da resposta, então precisamos de folga: com um
 * orçamento curto o modelo gasta tudo pensando e devolve conteúdo vazio.
 * Era exatamente isso que fazia o resumo do amor cair sempre no texto fixo.
 */
function isReasoningModel(provider: AIProvider, model: string): boolean {
  if (provider === "deepseek") return model.startsWith("deepseek-v4");
  if (provider === "anthropic") return /claude-(opus|sonnet)-5/.test(model);
  return false;
}

/** Reserva de tokens para o raciocínio, somada ao que a resposta precisa. */
const REASONING_HEADROOM = 1400;

/**
 * Modelos que rejeitam `temperature` / `top_p` (HTTP 400).
 * Vale para a família Claude 5 e Opus 4.7+.
 */
function rejectsSampling(provider: AIProvider, model: string): boolean {
  return provider === "anthropic" && /claude-(opus|sonnet|fable)-5|claude-opus-4-[78]/.test(model);
}

type CallArgs = {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  seed?: number;
  /** Limite da chamada externa. Evita que uma ação do usuário fique presa ao
   * provedor; o chamador decide o fallback ao capturar o erro. */
  timeoutMs?: number;
};

/** Erro de IA com a causa legível, para o chamador decidir se tenta de novo. */
export class AIError extends Error {
  constructor(message: string, readonly kind: "empty" | "truncated" | "http" = "http") {
    super(message);
    this.name = "AIError";
  }
}

export async function callAI(args: CallArgs): Promise<string> {
  const { provider, model } = args;
  const chosen = resolveModel(provider, model);
  const reasoning = isReasoningModel(provider, chosen);

  const text = await requestAI(args, chosen, reasoning ? 1 : 0);
  if (text) return text;

  // Resposta vazia num modelo de raciocínio: o orçamento acabou no "pensar".
  // Tenta uma vez com bem mais folga antes de desistir.
  if (reasoning) {
    const retry = await requestAI(args, chosen, 2.5);
    if (retry) return retry;
  }
  throw new AIError("A IA não devolveu conteúdo. Tente novamente.", "empty");
}

/**
 * Uma chamada à API. `headroom` multiplica a reserva para o raciocínio
 * (0 = modelo sem raciocínio, sem reserva).
 */
async function requestAI(
  { provider, apiKey, system, messages, maxTokens = 700, temperature = 0.9, seed, timeoutMs = 15_000 }: CallArgs,
  chosen: string,
  headroom: number
): Promise<string> {
  const budget = maxTokens + Math.round(REASONING_HEADROOM * headroom);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
  if (provider === "anthropic") {
    const noSampling = rejectsSampling(provider, chosen);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chosen,
        max_tokens: budget,
        // Claude 5 rejeita temperature com HTTP 400 — a variação vem do prompt.
        ...(noSampling ? {} : { temperature }),
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new AIError(data?.error?.message || `Erro Anthropic (${res.status})`, "http");
    }
    // Só blocos de texto: blocos de raciocínio não são a resposta.
    const text = Array.isArray(data.content)
      ? data.content
          .filter((c: any) => c?.type === "text")
          .map((c: any) => c.text || "")
          .join("")
      : "";
    return text.trim();
  }

  // OpenAI e DeepSeek compartilham o mesmo formato de API.
  const baseUrl =
    provider === "deepseek"
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: chosen,
      max_tokens: budget,
      temperature,
      ...(seed !== undefined ? { seed } : {}),
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal: controller.signal,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new AIError(data?.error?.message || `Erro ${provider} (${res.status})`, "http");
  }

  const choice = data.choices?.[0];
  const content = (choice?.message?.content || "").trim();

  // `finish_reason: "length"` sem conteúdo = tudo virou raciocínio.
  if (!content && choice?.finish_reason === "length") return "";
  return content;
  } finally {
    clearTimeout(timeout);
  }
}
