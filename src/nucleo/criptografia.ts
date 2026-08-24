import crypto from "crypto";
import { appSecret } from "./segredo-aplicacao";

// Criptografia simétrica (AES-256-GCM) para guardar chaves de IA em repouso.
// A chave é derivada do APP_SECRET.

function getKey(): Buffer {
  return crypto.createHash("sha256").update(appSecret()).digest();
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return "";
  try {
    const [ivB64, tagB64, dataB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return "";
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return "";
  }
}

// Máscara para exibir uma chave sem revelá-la ("sk-…a1b2").
export function maskSecret(plain: string): string {
  if (!plain) return "";
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 3)}••••${plain.slice(-4)}`;
}
