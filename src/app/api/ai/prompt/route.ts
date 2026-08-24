import { requireUser, json, handle } from "@/nucleo/api";
import { callAI } from "@/nucleo/ia";
import { resolveProvider } from "@/nucleo/chave-ia";
import { getTimelineDigest, formatTimelineBlock } from "@/nucleo/ai/contexto";

// Perguntas de reserva — usadas quando não há IA configurada.
const FALLBACK = [
  "Qual foi o melhor momento do seu dia hoje?",
  "O que seu amor fez recentemente que te fez sorrir?",
  "Tem algo que você queria dizer e ainda não disse?",
  "Qual cheiro, música ou lugar te lembra vocês dois?",
  "Como você imagina vocês daqui a cinco anos?",
  "Qual foi a última vez que vocês riram muito juntos?",
  "O que você mais admira na pessoa que você ama?",
  "Que pequena coisa do dia a dia de vocês você não quer esquecer?",
];

export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const { provider, apiKey } = resolveProvider(user);
    const pick = () => FALLBACK[Math.floor(Math.random() * FALLBACK.length)];

    if (!apiKey) return json({ prompts: [pick(), pick(), pick()].filter((v, i, a) => a.indexOf(v) === i) });

    // Contexto: últimas memórias do casal (nunca as trancadas — ver src/nucleo/ai/context.ts).
    const timeline = await getTimelineDigest(user, { take: 8 });
    const digest = formatTimelineBlock(timeline);

    try {
      const reply = await callAI({
        provider,
        apiKey,
        model: user.aiModel || undefined,
        system:
          'Você ajuda um casal a escrever no diário deles. Com base na linha do tempo abaixo, crie 3 perguntas curtas, ' +
          "carinhosas e específicas que dêem vontade de escrever hoje. Nada genérico demais, nada invasivo. " +
          "Varie o assunto entre as 3 (não repita o mesmo ângulo em duas perguntas). " +
          'Responda APENAS um JSON: {"prompts":["...","...","..."]}',
        messages: [{ role: "user", content: digest }],
        maxTokens: 300,
        temperature: 0.95,
      });
      const m = reply.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      const prompts = Array.isArray(parsed?.prompts)
        ? parsed.prompts.filter((p: any) => typeof p === "string" && p.trim()).slice(0, 3)
        : [];
      return json({ prompts: prompts.length ? prompts : [pick(), pick()] });
    } catch {
      return json({ prompts: [pick(), pick()] });
    }
  });
}
