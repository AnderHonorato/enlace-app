import { customAlphabet } from "nanoid";
import { prisma } from "@/nucleo/prisma";
import { requireUser, requireSameOrigin, bad, json, handle } from "@/nucleo/api";
import { ensureChatUploadTable } from "@/nucleo/envios-conversa";
import {
  categoriaUpload,
  configSupabase,
  enviarObjetoPrivado,
  erroDeCota,
  limparUploadsAbandonados,
} from "@/nucleo/uploads-privados";

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

const MAX = 30 * 1024 * 1024;

function correspondeAssinatura(mime: string, buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const ascii = (inicio: number, fim: number) => buf.subarray(inicio, fim).toString("ascii");
  const hex = (inicio: number, fim: number) => buf.subarray(inicio, fim).toString("hex");

  switch (mime) {
    case "image/jpeg": return hex(0, 3) === "ffd8ff";
    case "image/png": return hex(0, 8) === "89504e470d0a1a0a";
    case "image/gif": return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "audio/ogg": return ascii(0, 4) === "OggS";
    case "audio/wav": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
    case "audio/mpeg": {
      if (ascii(0, 3) === "ID3") return true;
      return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
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

export async function POST(req: Request) {
  return handle(async () => {
    requireSameOrigin(req);
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

    await ensureChatUploadTable();
    const erroCota = await erroDeCota(user.coupleId, file.size);
    if (erroCota) return bad(erroCota, 413);

    const buf = Buffer.from(await file.arrayBuffer());
    if (!correspondeAssinatura(mime, buf)) {
      return bad("O conteúdo do arquivo não corresponde ao formato informado.", 415);
    }

    const categoria = categoriaUpload(form?.get("category") ?? null);
    const filename = `${name()}.${ext}`;
    const storageKey = `${user.coupleId}/${categoria}/${filename}`;
    const remoto = !!configSupabase();

    if (remoto && !(await enviarObjetoPrivado(storageKey, mime, buf))) {
      return bad("Não foi possível salvar o arquivo no armazenamento privado.", 502);
    }

    const stored = await prisma.chatUpload.create({
      data: {
        coupleId: user.coupleId,
        uploaderId: user.id,
        name: file.name.slice(0, 255) || filename,
        mime,
        size: file.size,
        data: remoto ? Buffer.alloc(0) : buf,
        storageProvider: remoto ? "supabase" : "database",
        storageKey: remoto ? storageKey : null,
        category: categoria,
      },
      select: { id: true },
    }).catch(async (error) => {
      if (remoto) {
        const { removerObjetoPrivado } = await import("@/nucleo/uploads-privados");
        await removerObjetoPrivado(storageKey);
      }
      throw error;
    });

    // O cliente recebe sempre o proxy autenticado. A URL real do bucket nunca
    // é persistida em posts, mensagens ou HTML entregue ao navegador.
    const url = `/api/uploads/${stored.id}`;
    void limparUploadsAbandonados(user.coupleId).catch(() => {});

    return json({
      uploadId: stored.id,
      url,
      type: tipoDeMidia(mime),
      name: file.name,
      size: file.size,
      category: categoria,
    }, 201);
  });
}
