import { customAlphabet } from "nanoid";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { ensureChatUploadTable } from "@/nucleo/envios-conversa";

export const runtime = "nodejs";

const name = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

const EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX = 30 * 1024 * 1024; // 30 MB

/**
 * Recebe mídia do chat. Usa Supabase Storage quando configurado e, sem ele,
 * persiste os bytes no próprio banco. Nunca usa `public/uploads`: esse disco
 * é temporário na Vercel e fazia o arquivo existir só para uma das pessoas.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se ao seu amor antes de enviar arquivos.");
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return bad("Arquivo não enviado.");

    const mime = file.type;
    const kind = mime.startsWith("audio/") ? "audio" : mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : "file";
    if (file.size > MAX) return bad("Arquivo muito grande (máx. 30 MB).");

    const ext = EXT[mime] || file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const filename = `${name()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    let url = `/uploads/${filename}`;
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
    if (supabaseUrl && serviceKey) {
      const remote = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filename}`, { method: "POST", headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": mime, "x-upsert": "true" }, body: buf });
      if (!remote.ok) return bad("Não foi possível salvar o arquivo no armazenamento.", 502);
      url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
    } else {
      await ensureChatUploadTable();
      const stored = await prisma.chatUpload.create({
        data: {
          coupleId: user.coupleId,
          uploaderId: user.id,
          name: file.name.slice(0, 255) || filename,
          mime: mime || "application/octet-stream",
          size: file.size,
          data: buf,
        },
        select: { id: true },
      });
      url = `/api/uploads/${stored.id}`;
    }
    return json({ url, type: kind, name: file.name, size: file.size }, 201);
  });
}
