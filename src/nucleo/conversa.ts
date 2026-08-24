const CHAT_PAYLOAD_PREFIX = "__enlace_chat_v1__:";

export type ChatAttachment = {
  url: string;
  type: "audio" | "image" | "video" | "file";
  name?: string;
  size?: number;
};

function isAttachment(value: unknown): value is ChatAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.url === "string" &&
    ["audio", "image", "video", "file"].includes(String(item.type))
  );
}

export function decodeChatContent(raw: string): { content: string; attachments: ChatAttachment[] } {
  if (!raw.startsWith(CHAT_PAYLOAD_PREFIX)) return { content: raw, attachments: [] };
  try {
    const parsed = JSON.parse(raw.slice(CHAT_PAYLOAD_PREFIX.length));
    return {
      content: typeof parsed.content === "string" ? parsed.content : "",
      attachments: Array.isArray(parsed.attachments) ? parsed.attachments.filter(isAttachment) : [],
    };
  } catch {
    // Uma mensagem antiga/corrompida continua visível em vez de desaparecer.
    return { content: raw, attachments: [] };
  }
}

export function encodeChatContent(content: string, attachments: ChatAttachment[]): string {
  if (!attachments.length) return content;
  return CHAT_PAYLOAD_PREFIX + JSON.stringify({ content, attachments });
}

export function serializeChatMessage(message: any, meId: string) {
  const decoded = decodeChatContent(message.content);
  return {
    id: message.id,
    content: decoded.content,
    attachments: decoded.attachments,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt ? message.readAt.toISOString() : null,
    senderId: message.senderId,
    isMine: message.senderId === meId,
    sender: message.sender,
  };
}
