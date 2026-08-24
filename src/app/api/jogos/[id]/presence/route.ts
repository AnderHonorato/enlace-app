import { requireUser, json, handle } from "@/nucleo/api";
import { getSessionOr404, markSessionOffline } from "@/nucleo/sessao-jogo";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const session = await getSessionOr404(params.id, user.id);
    if (session.status === "active") await markSessionOffline(session, user.id);
    return json({ ok: true });
  });
}
