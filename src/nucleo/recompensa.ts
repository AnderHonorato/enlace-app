import "server-only";
import { prisma } from "./prisma";
import { callAI } from "./ia";
import { resolveProvider } from "./chave-ia";
import { baseEntryPoints } from "./pontos";
import {
  getCoupleFacts,
  getTimelineDigest,
  getRecentInsights,
  formatCoupleFactsBlock,
  formatTimelineBlock,
  formatAvoidRepeatBlock,
} from "./ai/contexto";

export async function awardPoints(userId: string, amount: number) {
  if (amount <= 0) return;
  await prisma.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
}

function extractJson(s: string): any {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/**
 * Calcula os pontos de uma memória. Se o usuário tiver chave de IA,
 * a IA analisa o texto e dá um bônus + uma frase carinhosa (insight).
 */
export type DetectedPlan = { title: string; kind: "date" | "lugar" | "sonho" | "outro" };

export async function analyzeEntry(
  user: any,
  plain: string,
  mood: string | null,
  photos: number
): Promise<{ points: number; insight: string | null; plans: DetectedPlan[] }> {
  const base = baseEntryPoints({ contentLength: plain.length, hasMood: !!mood, photos });

  const { provider, apiKey } = resolveProvider(user);
  if (!apiKey || plain.trim().length < 8) return { points: base, insight: null, plans: [] };

  try {
    // Contexto do casal — nível, sequência, como se conheceram, planos em
    // aberto — e a linha do tempo recente (as DUAS pessoas; nunca memórias
    // trancadas, ver src/nucleo/ai/context.ts). Sem isso o "insight" só via o
    // texto solto desta entrada e não tinha como notar nada além do óbvio.
    const [facts, timeline, recentInsights] = await Promise.all([
      getCoupleFacts(user).catch(() => null),
      getTimelineDigest(user, { take: 10 }).catch(() => null),
      getRecentInsights(user, 8).catch(() => [] as string[]),
    ]);

    const system = [
      'Você é o coração do app "Enlace", um diário de casais. Avalie a entrada abaixo pela sinceridade, ' +
        "carinho e conexão que ela demonstra. Detecte também se o casal mencionou algum PLANO ou DESEJO futuro " +
        "(uma viagem, um lugar pra conhecer, um encontro marcado, um sonho). Só inclua planos realmente citados no texto.",
      facts ? formatCoupleFactsBlock(facts) : "",
      timeline ? formatTimelineBlock(timeline) : "",
      "Use o contexto acima só para ENTENDER o casal e notar algo que o texto sozinho não mostraria " +
        "(um padrão, uma mudança, uma continuação). O insight ainda precisa ser sobre O QUE FOI ESCRITO agora — " +
        "não sobre memórias antigas, e nunca invente nada que não esteja em algum desses textos reais.",
      formatAvoidRepeatBlock(recentInsights, "Frases que você já usou em memórias anteriores deste casal"),
      "Responda APENAS um JSON válido no formato " +
        '{"points": <inteiro de 1 a 15>, "insight": "<frase curta, calorosa e específica em português, até 20 palavras>", ' +
        '"plans": [{"title": "<plano curto, até 8 palavras>", "kind": "date|lugar|sonho|outro"}]}. ' +
        'Se não houver planos, use "plans": []. Nada além do JSON.',
    ]
      .filter(Boolean)
      .join("\n");

    const reply = await callAI({
      provider,
      apiKey,
      model: user.aiModel || undefined,
      system,
      messages: [{ role: "user", content: plain.slice(0, 2000) }],
      maxTokens: 200,
      temperature: 0.6,
      timeoutMs: 1_800,
    });
    const parsed = extractJson(reply);
    if (!parsed) return { points: base, insight: null, plans: [] };
    const bonus = clamp(Number(parsed.points) || 5, 1, 15);
    const insight = typeof parsed.insight === "string" ? parsed.insight.trim().slice(0, 240) : null;

    const kinds = new Set(["date", "lugar", "sonho", "outro"]);
    const plans: DetectedPlan[] = Array.isArray(parsed.plans)
      ? parsed.plans
          .filter((p: any) => p && typeof p.title === "string" && p.title.trim())
          .slice(0, 3)
          .map((p: any) => ({
            title: p.title.trim().slice(0, 160),
            kind: kinds.has(p.kind) ? p.kind : "outro",
          }))
      : [];

    return { points: base + bonus, insight, plans };
  } catch {
    return { points: base, insight: null, plans: [] };
  }
}
