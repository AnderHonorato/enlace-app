import crypto from "crypto";
import {
  dataEncryptionSecret,
  legacyDataEncryptionSecret,
} from "./segredo-aplicacao";

const VERSION = "v2";

function chave(segredo: string): Buffer {
  return crypto.createHash("sha256").update(segredo).digest();
}

function abrir(ivB64: string, tagB64: string, dataB64: string, segredo: string): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    chave(segredo),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** Cifra novos dados com uma chave exclusiva e inclui versão no envelope. */
export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", chave(dataEncryptionSecret()), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/**
 * Abre o envelope v2 e continua entendendo o formato antigo sem versão. Isso
 * permite trocar a chave de dados gradualmente, sem inutilizar chaves de IA
 * que já estejam salvas no banco.
 */
export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return "";
  try {
    const parts = payload.split(":");
    if (parts[0] === VERSION) {
      const [, ivB64, tagB64, dataB64] = parts;
      if (!ivB64 || !tagB64 || !dataB64) return "";
      return abrir(ivB64, tagB64, dataB64, dataEncryptionSecret());
    }

    // Formato legado: iv:tag:dados, derivado do antigo APP_SECRET.
    const [ivB64, tagB64, dataB64] = parts;
    if (!ivB64 || !tagB64 || !dataB64) return "";
    return abrir(ivB64, tagB64, dataB64, legacyDataEncryptionSecret());
  } catch {
    return "";
  }
}

export function encryptedSecretNeedsUpgrade(payload: string | null | undefined): boolean {
  return !!payload && !payload.startsWith(`${VERSION}:`);
}

// Máscara para exibir uma chave sem revelá-la ("sk-…a1b2").
export function maskSecret(plain: string): string {
  if (!plain) return "";
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 3)}••••${plain.slice(-4)}`;
}
