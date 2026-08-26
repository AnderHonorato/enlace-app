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

function correspondeAssinatura(mime: string, buf: Buffer): boolean {
  if (buf.length < 4) return false;

  const ascii = (inicio: number, fim: number) => buf.subarray(inicio, fim).toString("ascii");
  const hex = (inicio: number, fim: number) => buf.subarray(inicio, fim).toString("hex");

  switch (mime) {
    case "image/jpeg":
      return hex(0, 3) === "ffd8ff";
    case "image/png":
      return hex(0, 8) === "89504e470d0a1a0a";
    case "image/gif":
      return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf":
      return ascii(0, 5) === "%PDF-";
    case "audio/ogg":
      return ascii(0, 4) === "OggS";
    case "audio/wav":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
    case "audio/mpeg": {
      if (ascii(0, 3) === "ID3") return true;
      const primeiro = buf[0];
      const segundo = buf[1];
      return primeiro === 0xff && (segundo & 0xe0) === 0xe0;
    }
    case "audio/webm":
    case "video/webm":
      return hex(0, 4) === "1a45dfa3";
    case "audio/mp4":
    case "video/mp4":
    case "video/quicktime":
      return ascii(4, 8) === "ftyp";
    default:
      return false;
  }
}

function tipoDeMidia(mime: string): "audio" | "video" | "image" | "file" {
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return "file";
}

/**
 * Recebe mídia do chat. Só aceita formatos conhecidos e confere a assinatura
 * básica dos bytes antes de armazenar o arquivo.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se ao seu amor antes de enviar arquivos.");

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return bad("Arquivo não enviado.");
    if (file.size <= 0) return bad("O arquivo está vazio.");
    if (file.size > MAX) return bad("Arquivo muito grande (máx. 30 MB).");

    const mime = file.type.trim().toLowerCase();
    const ext = EXT[mime];
    if (!ext) return bad("Formato de arquivo não permitido.", 415);

    const buf = Buffer.from(await file.arrayBuffer());
    if (!correspondeAssinatura(mime, buf)) {
      return bad("O conteúdo do arquivo não corresponde ao formato informado.", 415);
    }

    const kind = tipoDeMidia(mime);
    const filename = `${name()}.${ext}`;
    let url = `/uploads/${filename}`;
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

    if (supabaseUrl && serviceKey) {
      const remote = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filename}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "content-type": mime,
          "x-upsert": "false",
        },
        body: buf,
      });
      if (!remote.ok) return bad("Não foi possível salvar o arquivo no armazenamento.", 502);

      // Mantém compatibilidade com a configuração atual. A migração do bucket
      // para privado será feita junto do proxy autenticado de mídia.
      url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
    } else {
      await ensureChatUploadTable();
      const stored = await prisma.chatUpload.create({
        data: {
          coupleId: user.coupleId,
          uploaderId: user.id,
          name: file.name.slice(0, 255) || filename,
          mime,
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
