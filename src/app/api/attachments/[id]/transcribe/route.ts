import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { decodeAttachmentCaption, encodeAttachmentCaption } from "@/nucleo/memorias";
import { resolveProvider } from "@/nucleo/chave-ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadAudio(url: string) {
  if (url.startsWith("/uploads/")) return readFile(path.join(process.cwd(), "public", url.substring(1)));
  const rawBase = process.env.NEXT_PUBLIC_APP_URL || "";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const response = await fetch(url.startsWith("http") ? url : base + url);
  if (!response.ok) throw new Error("Não foi possível ler o áudio.");
  return Buffer.from(await response.arrayBuffer());
}

function audioMime(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".mp3")) return "audio/mpeg";
  if (clean.endsWith(".m4a")) return "audio/mp4";
  if (clean.endsWith(".ogg")) return "audio/ogg";
  if (clean.endsWith(".wav")) return "audio/wav";
  return "audio/webm";
}

async function transcribe(buffer: Buffer, filename: string, mime: string, key: string, endpoint: string, model: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), filename);
  form.append("model", model);
  form.append("language", "pt");
  form.append("response_format", "json");
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.text !== "string") throw new Error(data.error?.message || "O provedor não retornou uma transcrição.");
  return data.text.trim();
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const attachment = await prisma.attachment.findUnique({ where: { id: params.id }, include: { entry: { select: { authorId: true, coupleId: true, visibility: true } } } });
    if (!attachment) return bad("Áudio não encontrado.", 404);
    if (attachment.type !== "audio") return bad("Somente áudios podem ser transcritos.");
    const allowed = attachment.entry.authorId === user.id || (!!user.coupleId && attachment.entry.coupleId === user.coupleId && attachment.entry.visibility === "shared");
    if (!allowed) return bad("Você não pode acessar este áudio.", 403);
    const current = decodeAttachmentCaption(attachment.caption);
    if (current.transcript) return json({ transcript: current.transcript, provider: "saved" });
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const resolved = resolveProvider(user);
    const openaiKey = resolved.provider === "openai" ? resolved.apiKey : process.env.OPENAI_API_KEY?.trim();
    if (!groqKey && !openaiKey) return bad("Configure GROQ_API_KEY para usar a transcrição gratuita. OpenAI é apenas um fallback opcional.", 400);
    let buffer: Buffer;
    try { buffer = await loadAudio(attachment.url); } catch (error: any) { return bad(error?.message || "Não foi possível ler o áudio.", 502); }
    const mime = audioMime(attachment.url);
    const filename = `enlace-${attachment.id}.${mime.split("/")[1] || "webm"}`;
    const providers = [
      groqKey ? { name: "groq", key: groqKey, endpoint: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo" } : null,
      openaiKey ? { name: "openai", key: openaiKey, endpoint: "https://api.openai.com/v1/audio/transcriptions", model: "whisper-1" } : null,
    ].filter(Boolean) as { name: string; key: string; endpoint: string; model: string }[];
    let lastError = "Não foi possível transcrever o áudio.";
    for (const provider of providers) {
      try {
        const transcript = await transcribe(buffer, filename, mime, provider.key, provider.endpoint, provider.model);
        if (!transcript) throw new Error("A transcrição veio vazia.");
        await prisma.attachment.update({ where: { id: attachment.id }, data: { caption: encodeAttachmentCaption(current.caption, transcript) } });
        return json({ transcript, provider: provider.name });
      } catch (error: any) {
        lastError = error?.message || lastError;
      }
    }
    return bad(lastError, 502);
  });
}
