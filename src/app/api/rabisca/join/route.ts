import { z } from "zod";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { joinRabiscaRoom, serializeRabiscaRoom } from "@/nucleo/rabisca/servidor";

const schema = z.object({ code: z.string().min(4).max(12) });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return bad("Digite o código da sala.", 400);
    const room = await joinRabiscaRoom(parsed.data.code, user.id);
    return json({ room: await serializeRabiscaRoom(room, user.id) });
  });
}
