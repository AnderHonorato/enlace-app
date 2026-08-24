import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { callAI, type AIMessage } from "@/nucleo/ia";
import { resolveProvider } from "@/nucleo/chave-ia";
import { characterOf } from "@/nucleo/personagens";
import { awardPoints } from "@/nucleo/recompensa";
import { POINTS } from "@/nucleo/pontos";
import {
  getCoupleFacts,
  formatCoupleFactsBlock,
  formatOlderMessagesBlock,
  formatAvoidRepeatBlock,
  extractRecentAssistantLines,
} from "@/nucleo/ai/contexto";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const slug = new URL(req.url).searchParams.get("character") || "";
    if (!characterOf(slug)) return bad("Personagem inválido.", 404);
    const msgs = await prisma.chatMessage.findMany({
      where: { userId: user.id, character: slug },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return json({
      messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() })),
    });
  });
}

const schema = z.object({
  character: z.string().min(1),
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(4000),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const character = characterOf(parsed.data.character);
    if (!character) return bad("Personagem inválido.", 404);

    const { provider, apiKey } = resolveProvider(user);
    if (!apiKey) {
      return json(
        { error: "no_key", message: "Configure sua chave de IA nas Configurações para conversar." },
        400
      );
    }

    // Janela maior que o que vai verbatim: o resto vira resumo comprimido em
    // vez de simplesmente ser esquecido — é isso que faz a conversa parecer
    // contínua numa sessão longa, sem mandar tudo cru (custo/latência).
    const history = await prisma.chatMessage.findMany({
      where: { userId: user.id, character: character.slug },
      orderBy: { createdAt: "asc" },
      take: 80,
    });
    const VERBATIM = 24;
    const verbatim = history.slice(-VERBATIM);
    const older = history.slice(0, Math.max(0, history.length - VERBATIM));

    const messages: AIMessage[] = [
      ...verbatim.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: parsed.data.message },
    ];

    // Contexto do casal (fatos verificáveis — nunca conteúdo de memórias, que
    // são privadas) + o início comprimido da conversa + as próprias falas
    // recentes do personagem, para ele não reciclar a mesma abertura de
    // sempre. Isto substitui a antiga `coupleContext` local, que via só nome,
    // aniversário e "como se conheceram" — sem nível, sequência ou planos.
    const facts = await getCoupleFacts(user).catch(() => null);
    const system = [
      character.persona,
      facts ? formatCoupleFactsBlock(facts) : "",
      formatOlderMessagesBlock(older, 16),
      formatAvoidRepeatBlock(
        extractRecentAssistantLines(verbatim, 8),
        `Suas últimas falas nesta conversa, como ${character.name}`
      ),
    ]
      .filter(Boolean)
      .join("\n\n");

    let reply: string;
    try {
      reply = await callAI({
        provider,
        apiKey,
        model: user.aiModel || undefined,
        system,
        messages,
        maxTokens: 900,
        temperature: 1.0,
      });
    } catch (e: any) {
      return json({ error: "ai_error", message: e?.message || "Falha ao falar com a IA." }, 502);
    }
    if (!reply) reply = "…";

    const [, assistant] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { userId: user.id, character: character.slug, role: "user", content: parsed.data.message },
      }),
      prisma.chatMessage.create({
        data: { userId: user.id, character: character.slug, role: "assistant", content: reply },
      }),
    ]);

    await awardPoints(user.id, POINTS.chat);
    return json({ reply, id: assistant.id });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const slug = new URL(req.url).searchParams.get("character") || "";
    if (!characterOf(slug)) return bad("Personagem inválido.", 404);
    await prisma.chatMessage.deleteMany({ where: { userId: user.id, character: slug } });
    return json({ ok: true });
  });
}
