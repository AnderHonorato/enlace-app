import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { awardPoints } from "@/nucleo/recompensa";
import { serializeCapsule } from "@/nucleo/planos";
import { notifyPartner } from "@/nucleo/notificacoes";
import { z } from "zod";

type ContextoRota = { params: Promise<{ id: string }> };

// Detalhe da cápsula — regra de selo: se ainda não pode abrir, esconde conteúdo
export async function GET(_req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!capsule || capsule.coupleId !== user.coupleId) return bad("Cápsula não encontrada.", 404);
    return json({ capsule: serializeCapsule(capsule, user.id) });
  });
}

// Abrir cápsula (só depois da data)
export async function PATCH(_req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!capsule || capsule.coupleId !== user.coupleId) return bad("Cápsula não encontrada.", 404);
    if (capsule.openAt.getTime() > Date.now()) {
      return bad("Essa cápsula ainda está lacrada. Espere a data chegar 💌", 403);
    }
    const updated = capsule.openedAt
      ? capsule
      : await prisma.capsule.update({
          where: { id: capsule.id },
          data: { openedAt: new Date(), status: "OPENED" },
          include: { items: { orderBy: { createdAt: "asc" } } },
        });

    if (!capsule.openedAt) {
      await awardPoints(user.id, 5);
      const itemCount = capsule.items?.length ?? 0;
      const photoCount = capsule.items?.filter((i) => i.image).length ?? 0;
      let body = capsule.title || "Venha ver o que estava guardado";
      if (itemCount > 0) {
        const parts: string[] = [];
        if (itemCount) parts.push(`${itemCount} ${itemCount === 1 ? "item" : "itens"}`);
        if (photoCount) parts.push(`${photoCount} ${photoCount === 1 ? "foto" : "fotos"}`);
        body += ` · ${parts.join(" e ")}`;
      }
      notifyPartner(user.id, user.coupleId, {
        kind: "capsule_open",
        title: `${user.displayName || user.name} abriu a cápsula do tempo 🎁`,
        body,
        url: "/app/planos?aba=capsulas",
        entityType: "capsule",
        entityId: capsule.id,
      }).catch(() => {});
    }
    return json({ capsule: serializeCapsule(updated, user.id) });
  });
}

// Adicionar item à cápsula (só se ainda selada)
const addItemSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  mood: z.string().max(30).nullable().optional(),
  image: z.string().max(2000).nullable().optional(),
});

export async function PUT(req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const capsule = await prisma.capsule.findUnique({ where: { id } });
    if (!capsule || capsule.coupleId !== user.coupleId) return bad("Cápsula não encontrada.", 404);
    if (capsule.openAt.getTime() <= Date.now() || capsule.status === "OPENED") {
      return bad("Esta cápsula já foi aberta ou a data de abertura já passou.", 400);
    }
    const body = await req.json().catch(() => ({}));
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const item = await prisma.capsuleItem.create({
      data: {
        capsuleId: capsule.id,
        authorId: user.id,
        message: parsed.data.message,
        mood: parsed.data.mood || null,
        image: parsed.data.image || null,
      },
    });
    return json({ item }, 201);
  });
}

export async function DELETE(_req: Request, { params }: ContextoRota) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const capsule = await prisma.capsule.findUnique({ where: { id } });
    if (!capsule || capsule.coupleId !== user.coupleId) return bad("Cápsula não encontrada.", 404);
    if (capsule.authorId !== user.id) return bad("Só quem criou pode apagar.", 403);
    await prisma.capsule.delete({ where: { id: capsule.id } });
    return json({ ok: true });
  });
}
