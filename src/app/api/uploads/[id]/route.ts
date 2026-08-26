import { prisma } from "@/nucleo/prisma";
import { requireUser, requireIdentity, bad, json, handle } from "@/nucleo/api";
import { ensureChatUploadTable } from "@/nucleo/envios-conversa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INLINE_MIMES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function safeName(name: string): string {
  return name.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "arquivo";
}

function cabecalhosDoArquivo(nome: string, mime: string) {
  const tipoSeguro = INLINE_MIMES.has(mime) ? mime : "application/octet-stream";
  const disposicao = INLINE_MIMES.has(mime) ? "inline" : "attachment";

  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300, must-revalidate",
    "Content-Disposition": `${disposicao}; filename="${safeName(nome)}"`,
    "Content-Type": tipoSeguro,
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Arquivo não encontrado.", 404);

    await ensureChatUploadTable();
    const upload = await prisma.chatUpload.findFirst({
      where: { id: params.id, coupleId: user.coupleId },
    });
    if (!upload) return bad("Arquivo não encontrado.", 404);

    const data = Buffer.from(upload.data);
    const range = req.headers.get("range");
    const commonHeaders = cabecalhosDoArquivo(upload.name, upload.mime || "application/octet-stream");

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const requestedEnd = match[2] ? Number(match[2]) : data.length - 1;
        const end = Math.min(requestedEnd, data.length - 1);
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end) {
          const chunk = data.subarray(start, end + 1);
          return new Response(chunk, {
            status: 206,
            headers: {
              ...commonHeaders,
              "Content-Length": String(chunk.length),
              "Content-Range": `bytes ${start}-${end}/${data.length}`,
            },
          });
        }
      }
      return new Response(null, {
        status: 416,
        headers: { ...commonHeaders, "Content-Range": `bytes */${data.length}` },
      });
    }

    return new Response(data, {
      headers: { ...commonHeaders, "Content-Length": String(data.length) },
    });
  });
}

/** Remove um envio que ainda não foi anexado. Evita acumular arquivos quando
 * a pessoa tira uma mídia do rascunho antes de publicar. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireIdentity();
    await ensureChatUploadTable();
    const upload = await prisma.chatUpload.findUnique({
      where: { id: params.id },
      select: { id: true, uploaderId: true },
    });
    if (!upload || upload.uploaderId !== user.id) return bad("Arquivo não encontrado.", 404);

    const url = `/api/uploads/${upload.id}`;
    const [attachment, message] = await Promise.all([
      prisma.attachment.findFirst({ where: { url }, select: { id: true } }),
      prisma.message.findFirst({ where: { content: { contains: url } }, select: { id: true } }),
    ]);
    if (attachment || message) return bad("Este arquivo já está em uso.", 409);

    await prisma.chatUpload.delete({ where: { id: upload.id } });
    return json({ ok: true });
  });
}
