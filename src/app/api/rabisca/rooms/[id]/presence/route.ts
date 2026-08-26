import { requireUser, json, handle } from "@/nucleo/api";
import { setRabiscaOffline } from "@/nucleo/rabisca/servidor";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    await setRabiscaOffline((await params).id, user.id, url.searchParams.get("leave") === "1");
    return json({ ok: true });
  });
}
