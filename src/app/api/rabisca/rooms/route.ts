import { requireUser, json, handle } from "@/nucleo/api";
import {
  createRabiscaRoom,
  currentRabiscaRoom,
  serializeRabiscaRoom,
} from "@/nucleo/rabisca/servidor";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const room = await currentRabiscaRoom(user.id);
    return json({ room: room ? await serializeRabiscaRoom(room, user.id) : null });
  });
}

export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    const existing = await currentRabiscaRoom(user.id);
    const room = existing ?? (await createRabiscaRoom(user.id));
    return json({ room: await serializeRabiscaRoom(room, user.id), existing: !!existing });
  });
}
