import "server-only";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { ensureChatUploadTable } from "./envios-conversa";

/** Apaga mídias removidas, tanto no legado em disco quanto no armazenamento persistente. */
export async function removeUploads(urls: (string | null | undefined)[]) {
  const cleanUrls = urls.filter((u): u is string => !!u);
  const files = cleanUrls
    .filter((u): u is string => !!u && u.startsWith("/uploads/"))
    .map((u) => path.basename(u)) // evita path traversal
    .filter((f) => f && !f.includes("..") && !f.includes("/") && !f.includes("\\"));

  await Promise.all(
    files.map((f) => unlink(path.join(process.cwd(), "public", "uploads", f)).catch(() => {}))
  );

  const databaseIds = cleanUrls
    .map((url) => url.match(/^\/api\/uploads\/([^/?#]+)$/)?.[1])
    .filter((id): id is string => !!id);
  if (databaseIds.length) {
    await ensureChatUploadTable();
    await prisma.chatUpload.deleteMany({ where: { id: { in: databaseIds } } }).catch(() => {});
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
  if (supabaseUrl && serviceKey) {
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
    const remoteNames = cleanUrls
      .filter((url) => url.startsWith(publicPrefix))
      .map((url) => url.slice(publicPrefix.length))
      .filter((name) => name && !name.includes(".."));

    await Promise.all(
      remoteNames.map((name) =>
        fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${name}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        }).catch(() => null)
      )
    );
  }
}
