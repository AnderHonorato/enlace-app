import "server-only";
import { prisma } from "./prisma";
import { ensureChatUploadTable } from "./envios-conversa";

export const CATEGORIAS_UPLOAD = ["chat", "avatar", "album", "memorias"] as const;
export type CategoriaUpload = (typeof CATEGORIAS_UPLOAD)[number];

const COTA_TOTAL_PADRAO = 1024 * 1024 * 1024; // 1 GB por casal
const COTA_DIA_PADRAO = 250 * 1024 * 1024; // 250 MB por dia
const ABANDONO_MS = 24 * 60 * 60 * 1000;

function limiteEnv(nome: string, padrao: number) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : padrao;
}

function corpoBinario(dados: Buffer): ArrayBuffer {
  return Uint8Array.from(dados).buffer;
}

export function categoriaUpload(valor: FormDataEntryValue | null): CategoriaUpload {
  return typeof valor === "string" && (CATEGORIAS_UPLOAD as readonly string[]).includes(valor)
    ? (valor as CategoriaUpload)
    : "chat";
}

export function idDeUrlUpload(url: string): string | null {
  const match = /^\/api\/uploads\/([a-zA-Z0-9_-]{8,80})$/.exec(url.trim());
  return match?.[1] ?? null;
}

export async function validarUploadsDoCasal(coupleId: string, urls: string[]) {
  if (!urls.length) return true;
  await ensureChatUploadTable();
  const ids = urls.map(idDeUrlUpload);
  if (ids.some((id) => !id)) return false;
  const unicos = [...new Set(ids.filter((id): id is string => !!id))];
  const encontrados = await prisma.chatUpload.count({
    where: { id: { in: unicos }, coupleId },
  });
  return encontrados === unicos.length;
}

export async function erroDeCota(coupleId: string, novosBytes: number): Promise<string | null> {
  await ensureChatUploadTable();
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const [total, hoje] = await Promise.all([
    prisma.chatUpload.aggregate({ where: { coupleId }, _sum: { size: true } }),
    prisma.chatUpload.aggregate({
      where: { coupleId, createdAt: { gte: inicioDoDia } },
      _sum: { size: true },
    }),
  ]);

  const limiteTotal = limiteEnv("UPLOAD_COUPLE_QUOTA_BYTES", COTA_TOTAL_PADRAO);
  const limiteDia = limiteEnv("UPLOAD_DAILY_QUOTA_BYTES", COTA_DIA_PADRAO);
  if ((total._sum.size ?? 0) + novosBytes > limiteTotal) {
    return "O espaço de mídia do casal chegou ao limite. Remova arquivos antigos antes de enviar novos.";
  }
  if ((hoje._sum.size ?? 0) + novosBytes > limiteDia) {
    return "O limite diário de uploads foi atingido. Tente novamente amanhã.";
  }
  return null;
}

export function configSupabase() {
  const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
  return base && token ? { base, token, bucket } : null;
}

function headersSupabase(token: string, mime?: string) {
  return {
    Authorization: `Bearer ${token}`,
    apikey: token,
    ...(mime ? { "content-type": mime } : {}),
  };
}

export async function enviarObjetoPrivado(chave: string, mime: string, dados: Buffer) {
  const cfg = configSupabase();
  if (!cfg) return false;
  const res = await fetch(`${cfg.base}/storage/v1/object/${cfg.bucket}/${encodeURI(chave)}`, {
    method: "POST",
    headers: { ...headersSupabase(cfg.token, mime), "x-upsert": "false" },
    body: corpoBinario(dados),
  });
  return res.ok;
}

export async function baixarObjetoPrivado(chave: string): Promise<Buffer | null> {
  const cfg = configSupabase();
  if (!cfg) return null;
  const res = await fetch(
    `${cfg.base}/storage/v1/object/authenticated/${cfg.bucket}/${encodeURI(chave)}`,
    { headers: headersSupabase(cfg.token), cache: "no-store" }
  );
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

export async function removerObjetoPrivado(chave: string | null | undefined) {
  const cfg = configSupabase();
  if (!cfg || !chave) return;
  await fetch(`${cfg.base}/storage/v1/object/${cfg.bucket}/${encodeURI(chave)}`, {
    method: "DELETE",
    headers: headersSupabase(cfg.token),
  }).catch(() => null);
}

/** Limpa poucos rascunhos antigos por vez para não transformar upload em job pesado. */
export async function limparUploadsAbandonados(coupleId: string) {
  await ensureChatUploadTable();
  const antigos = await prisma.chatUpload.findMany({
    where: { coupleId, createdAt: { lt: new Date(Date.now() - ABANDONO_MS) } },
    select: { id: true, storageProvider: true, storageKey: true },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  for (const upload of antigos) {
    const url = `/api/uploads/${upload.id}`;
    const [anexo, mensagem] = await Promise.all([
      prisma.attachment.findFirst({ where: { url }, select: { id: true } }),
      prisma.message.findFirst({ where: { content: { contains: url } }, select: { id: true } }),
    ]);
    if (anexo || mensagem) continue;
    if (upload.storageProvider === "supabase") await removerObjetoPrivado(upload.storageKey);
    await prisma.chatUpload.delete({ where: { id: upload.id } }).catch(() => null);
  }
}
