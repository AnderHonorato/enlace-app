import { prisma } from "@/nucleo/prisma";
import { requireUser, requireSameOrigin, json, handle } from "@/nucleo/api";
import { destroySession } from "@/nucleo/autenticacao";

export async function DELETE(req: Request) {
  return handle(async () => {
    requireSameOrigin(req);
    const user = await requireUser();
    const coupleId = user.coupleId;

    // Apaga apenas os dados ligados diretamente a esta conta. O casal não é
    // dissolvido se o parceiro ainda existir: isso evita apagar por cascata
    // cápsulas, tarefas, planos e outras memórias compartilhadas dele.
    await prisma.user.delete({ where: { id: user.id } });

    if (coupleId) {
      const membrosRestantes = await prisma.user.count({ where: { coupleId } });
      if (membrosRestantes === 0) {
        await prisma.couple.delete({ where: { id: coupleId } }).catch(() => {});
      }
    }

    await destroySession();
    return json({ ok: true });
  });
}
