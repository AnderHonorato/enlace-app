import { destroySession } from "@/nucleo/autenticacao";
import { json, handle } from "@/nucleo/api";

export async function POST() {
  return handle(async () => {
    await destroySession();
    return json({ ok: true });
  });
}
