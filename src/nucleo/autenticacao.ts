import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sessionSecret } from "./segredo-aplicacao";
import {
  criarSessaoRevogavel,
  revogarSessao,
  revogarTodasSessoes,
  sessaoEstaAtiva,
} from "./sessoes-autenticacao";

const COOKIE = "amora_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

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

export function passwordHashNeedsUpgrade(hash: string): boolean {
  const match = /^\$2[aby]\$(\d{2})\$/.exec(hash);
  if (!match) return true;
  return Number(match[1]) < 12;
}

async function limparCookie() {
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

async function lerIdentidadeDaSessao(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const userId = typeof payload.uid === "string" ? payload.uid : "";
    const sessionId = typeof payload.sid === "string" ? payload.sid : "";
    if (!userId || !sessionId) return null;
    if (!(await sessaoEstaAtiva(sessionId, userId))) return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const sessao = await criarSessaoRevogavel(userId, expiresAt);
  const token = await new SignJWT({ uid: userId, sid: sessao.id })
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
  const identidade = await lerIdentidadeDaSessao();
  if (identidade) await revogarSessao(identidade.sessionId).catch(() => {});
  await limparCookie();
}

export async function destroyAllSessions(userId: string) {
  await revogarTodasSessoes(userId);
  await limparCookie();
}

export async function getUserId(): Promise<string | null> {
  const identidade = await lerIdentidadeDaSessao();
  return identidade?.userId ?? null;
}

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
