import { requireUser, requireSameOrigin, json, handle } from "@/nucleo/api";
import { destroyAllSessions } from "@/nucleo/autenticacao";
import { listarSessoesAtivas } from "@/nucleo/sessoes-autenticacao";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const sessions = await listarSessoesAtivas(user.id);
    return json({ sessions });
  });
}

/** Encerra todas as sessões da conta, inclusive a atual. */
export async function DELETE(req: Request) {
  return handle(async () => {
    requireSameOrigin(req);
    const user = await requireUser();
    await destroyAllSessions(user.id);
    return json({ ok: true });
  });
}
