import { destroySession } from "@/nucleo/autenticacao";
import { json, handle } from "@/nucleo/api";

export async function POST() {
  return handle(async () => {
    destroySession();
    return json({ ok: true });
  });
}
