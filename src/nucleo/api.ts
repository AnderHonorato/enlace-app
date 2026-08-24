import { NextResponse } from "next/server";
import { getCurrentUser, getUserId } from "./autenticacao";
import { prisma } from "./prisma";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Retorna o usuário autenticado ou lança uma Response 401 (capturada por handle). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw bad("Não autenticado.", 401);
  return user;
}

/** Identidade mínima para polls e contadores frequentes. Evita carregar todas
 * as preferências do usuário, o casal e os membros em cada batimento. */
export async function requireIdentity() {
  const id = await getUserId();
  if (!id) throw bad("Não autenticado.", 401);
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, coupleId: true } });
  if (!user) throw bad("Não autenticado.", 401);
  return user;
}

/** Envolve um handler, convertendo Responses lançadas e erros em JSON. */
export function handle(
  fn: () => Promise<Response>
): Promise<Response> {
  return fn().catch((e) => {
    if (e instanceof Response) return e;
    console.error(e);
    return bad("Algo deu errado no servidor.", 500);
  });
}
