import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { notify } from "@/nucleo/notificacoes";

const schema = z.object({ code: z.string().trim().min(4, "Código inválido.").max(20) });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (user.coupleId) return bad("Você já faz parte de um casal.");

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const inviteCode = parsed.data.code.toUpperCase().replace(/\s/g, "");
    const couple = await prisma.couple.findUnique({
      where: { inviteCode },
      include: { members: true },
    });
    if (!couple) return bad("Código não encontrado.", 404);
    if (couple.members.length >= 2) return bad("Esse casal já está completo.");
    if (couple.members.some((m) => m.id === user.id)) return bad("Você já está nesse casal.");

    await prisma.user.update({ where: { id: user.id }, data: { coupleId: couple.id } });
    // As memórias que a pessoa já tinha passam a fazer parte do diário do casal.
    await prisma.entry.updateMany({
      where: { authorId: user.id, coupleId: null },
      data: { coupleId: couple.id, visibility: "shared" },
    });

    // Nome padrão do casal quando os dois já estão presentes.
    if (!couple.name || couple.members.length === 1) {
      const other = couple.members[0];
      const a = other?.displayName || other?.name;
      const b = user.displayName || user.name;
      if (a) await prisma.couple.update({ where: { id: couple.id }, data: { name: `${a} & ${b}` } });
    }

    // Avisa quem criou o convite que o amor entrou.
    const nome = user.displayName || user.name;
    for (const m of couple.members) {
      notify({
        userId: m.id,
        actorId: user.id,
        kind: "couple",
        title: `${nome} entrou no diário de vocês 💞`,
        body: "A história de vocês começa agora.",
        url: "/app",
        entityType: "couple",
        entityId: couple.id,
      }).catch(() => {});
    }

    return json({ ok: true });
  });
}
