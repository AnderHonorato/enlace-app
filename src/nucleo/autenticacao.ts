import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sessionSecret } from "./segredo-aplicacao";

const COOKIE = "amora_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

// Resolvido sob demanda (não no import) para a falha em produção acontecer numa
// requisição, com mensagem clara, em vez de quebrar o build.
let secretBytes: Uint8Array | null = null;
function secretKey(): Uint8Array {
  if (!secretBytes) secretBytes = new TextEncoder().encode(sessionSecret());
  return secretBytes;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Retorna true quando um hash bcrypt antigo deve ser atualizado após login. */
export function passwordHashNeedsUpgrade(hash: string): boolean {
  const match = /^\$2[aby]\$(\d{2})\$/.exec(hash);
  if (!match) return true;
  return Number(match[1]) < 12;
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.uid === "string" && payload.uid.length > 0 ? payload.uid : null;
  } catch {
    return null;
  }
}

/**
 * Usuário atual com o casal (e o parceiro) carregados.
 *
 * Layout e página pedem o mesmo usuário durante a renderização de uma rota.
 * `cache` deduplica essa consulta dentro da requisição sem compartilhar dados
 * entre usuários ou transformar autenticação em cache público.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const uid = await getUserId();
  if (!uid) return null;
  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { couple: { include: { members: true } } },
  });
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
