import { requireUser, bad, json, handle } from "@/nucleo/api";
import {
  applyRabiscaAction,
  refreshRabiscaRoom,
  serializeRabiscaRoom,
} from "@/nucleo/rabisca/servidor";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const room = await refreshRabiscaRoom(params.id, user.id);
    return json({ room: await serializeRabiscaRoom(room, user.id) });
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const move = await req.json().catch(() => ({}));
    if (!move || typeof move !== "object" || typeof move.type !== "string") {
      return bad("Ação inválida.", 400);
    }
    const result = await applyRabiscaAction(params.id, user.id, move);
    if (!result.room) return bad("Sala não encontrada.", 404);
    return json({
      room: await serializeRabiscaRoom(result.room, user.id),
      ...(result.hint ? { hint: result.hint } : {}),
      ...(typeof result.similarity === "number" ? { similarity: result.similarity } : {}),
    });
  });
}
