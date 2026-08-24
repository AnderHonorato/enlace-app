import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { appSecret } from "./segredo-aplicacao";

const COOKIE = "amora_session";
// Resolvido sob demanda (não no import) para a falha em produção acontecer numa
// requisição, com mensagem clara, em vez de quebrar o build.
let secretBytes: Uint8Array | null = null;
function secretKey(): Uint8Array {
  if (!secretBytes) secretBytes = new TextEncoder().encode(appSecret());
  return secretBytes;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return (payload.uid as string) || null;
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
