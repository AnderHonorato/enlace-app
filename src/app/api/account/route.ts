import { prisma } from "@/nucleo/prisma";
import { requireUser, json, handle } from "@/nucleo/api";
import { destroySession } from "@/nucleo/autenticacao";

export async function DELETE() {
  return handle(async () => {
    const user = await requireUser();
    const coupleId = user.coupleId;

    // Apaga o usuário — em cascata: memórias, comentários, reações e conversas dele.
    await prisma.user.delete({ where: { id: user.id } });

    if (coupleId) {
      // Desvincula o parceiro e dissolve o casal (as memórias dele viram pessoais).
      await prisma.user.updateMany({ where: { coupleId }, data: { coupleId: null } });
      await prisma.couple.delete({ where: { id: coupleId } }).catch(() => {});
    }

    destroySession();
    return json({ ok: true });
  });
}
