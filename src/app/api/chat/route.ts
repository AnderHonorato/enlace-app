import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { authorSelect } from "@/nucleo/memorias";
import { awardPoints } from "@/nucleo/recompensa";
import { touchStreak } from "@/nucleo/sequencia";
import { notifyPartner } from "@/nucleo/notificacoes";
import { encodeChatContent, serializeChatMessage } from "@/nucleo/conversa";

/** Marca como lidas as mensagens recebidas (recibo de leitura). */
async function markIncomingRead(coupleId: string, meId: string) {
  await prisma.message.updateMany({
    where: { coupleId, senderId: { not: meId }, readAt: null },
    data: { readAt: new Date() },
  });
}

/** O parceiro está digitando? (ping de até 7s atrás em couple.typing) */
function partnerTypingFrom(typingJson: string, meId: string): boolean {
  try {
    const map = JSON.parse(typingJson || "{}") as Record<string, string>;
    return Object.entries(map).some(
      ([uid, ts]) => uid !== meId && Date.now() - new Date(ts).getTime() < 7000
    );
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return json({ messages: [], partnerTyping: false });
    const url = new URL(req.url);
    const after = url.searchParams.get("after");
    const readAfter = url.searchParams.get("readAfter");

    // Estar no chat = ler as mensagens do parceiro.
    await markIncomingRead(user.coupleId, user.id);

    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      select: { typing: true },
    });
    const partnerTyping = partnerTypingFrom(couple?.typing ?? "{}", user.id);

    if (after || readAfter) {
      const createdCursor = after ? new Date(after) : new Date(0);
      const readCursor = readAfter ? new Date(readAfter) : new Date(0);
      const validCreatedCursor = Number.isNaN(createdCursor.getTime()) ? new Date(0) : createdCursor;
      const validReadCursor = Number.isNaN(readCursor.getTime()) ? new Date(0) : readCursor;
      // Novas mensagens OU minhas mensagens lidas recentemente (p/ atualizar o "visto").
      const msgs = await prisma.message.findMany({
        where: {
          coupleId: user.coupleId,
          OR: [
            { createdAt: { gt: validCreatedCursor } },
            { senderId: user.id, readAt: { gt: validReadCursor } },
          ],
        },
        include: { sender: { select: authorSelect } },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      return json({ messages: msgs.map((m) => serializeChatMessage(m, user.id)), partnerTyping });
    }

    const recent = await prisma.message.findMany({
      where: { coupleId: user.coupleId },
      include: { sender: { select: authorSelect } },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return json({ messages: recent.reverse().map((m) => serializeChatMessage(m, user.id)), partnerTyping });
  });
}

const attachmentSchema = z.object({
  url: z.string().min(1).refine(
    (url) => url.startsWith("/api/uploads/") || url.startsWith("/uploads/") || url.startsWith("https://"),
    "Endereço de anexo inválido."
  ),
  type: z.enum(["audio", "image", "video", "file"]),
  name: z.string().max(255).optional(),
  size: z.number().int().nonnegative().max(30_000_000).optional(),
});
const schema = z.object({ content: z.string().trim().max(4000).default(""), attachments: z.array(attachmentSchema).max(10).default([]) }).refine((data) => data.content.length > 0 || data.attachments.length > 0, "Escreva uma mensagem ou anexe um arquivo.");

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Você precisa estar conectado a um casal.");
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const storedContent = encodeChatContent(parsed.data.content, parsed.data.attachments);

    const msg = await prisma.message.create({
      data: { coupleId: user.coupleId, senderId: user.id, content: storedContent },
      include: { sender: { select: authorSelect } },
    });
    await awardPoints(user.id, 1);
    await touchStreak(user.id);

    notifyPartner(user.id, user.coupleId, {
      kind: "chat",
      title: `${user.displayName || user.name} te mandou uma mensagem ✉️`,
      body: (parsed.data.content || "Um anexo novo").slice(0, 120),
      url: "/app/conversa",
      entityType: "message",
      entityId: msg.id,
    }).catch(() => {});

    return json({ message: serializeChatMessage(msg, user.id) }, 201);
  });
}
