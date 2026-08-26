import { requireUser, json, handle } from "@/nucleo/api";
import { getSessionOr404, touchPresenceAndCheckStale, serializeSession } from "@/nucleo/sessao-jogo";

export const dynamic = "force-dynamic";

// Poll da sessão — o cliente chama isso a cada ~3s enquanto a partida está
// ativa (e para de chamar quando a aba fica escondida). Cada chamada também
// grava "estou vivo" e, de brinde, checa se o parceiro sumiu (ver
// `touchPresenceAndCheckStale` em lib/gameSession.ts).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404((await params).id, user.id);
    const updated =
      session.status === "active" ? await touchPresenceAndCheckStale(session, user.id) : session;
    return json({ session: serializeSession(updated, user.id) });
  });
}
