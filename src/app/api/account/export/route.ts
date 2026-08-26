import { prisma } from "@/nucleo/prisma";
import { requireUser, handle } from "@/nucleo/api";
import { toPlain } from "@/nucleo/sanitizacao";

export const dynamic = "force-dynamic";

// Baixa uma cópia legível dos dados pessoais e compartilhados da conta sem
// incluir credenciais, hashes, PIN, chaves de IA ou segredos de push.
export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const [entries, comments, reactions, chat, messages, goals, wishes, capsules, summaries] =
      await Promise.all([
        prisma.entry.findMany({
          where: { authorId: user.id },
          include: { attachments: { select: { url: true, type: true, caption: true } } },
          orderBy: { entryDate: "asc" },
        }),
        prisma.comment.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "asc" } }),
        prisma.reaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
        prisma.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
        user.coupleId
          ? prisma.message.findMany({ where: { coupleId: user.coupleId }, orderBy: { createdAt: "asc" } })
          : Promise.resolve([]),
        user.coupleId ? prisma.goal.findMany({ where: { coupleId: user.coupleId } }) : Promise.resolve([]),
        user.coupleId ? prisma.wish.findMany({ where: { coupleId: user.coupleId } }) : Promise.resolve([]),
        user.coupleId ? prisma.capsule.findMany({ where: { coupleId: user.coupleId } }) : Promise.resolve([]),
        user.coupleId ? prisma.dailySummary.findMany({ where: { coupleId: user.coupleId } }) : Promise.resolve([]),
      ]);

    const couple = user.coupleId
      ? await prisma.couple.findUnique({
          where: { id: user.coupleId },
          select: { name: true, anniversary: true, metDate: true, howWeMet: true, createdAt: true },
        })
      : null;

    const data = {
      versaoDoFormato: 2,
      exportadoEm: new Date().toISOString(),
      app: "Enlace",
      perfil: {
        nome: user.name,
        apelido: user.displayName,
        email: user.email,
        bio: user.bio,
        aniversario: user.birthday,
        pontos: user.points,
        sequencia: user.streak,
        melhorSequencia: user.bestStreak,
        criadoEm: user.createdAt,
      },
      casal: couple,
      memorias: entries.map((e) => ({
        titulo: e.title,
        texto: toPlain(e.content),
        textoHtml: e.content,
        humor: e.mood,
        data: e.entryDate,
        lugar: e.place,
        coordenadas: e.lat != null && e.lng != null ? { lat: e.lat, lng: e.lng } : null,
        favorita: e.favorite,
        trancada: e.locked,
        visibilidade: e.visibility,
        tags: safeJson(e.tags),
        insightIA: e.insight,
        anexos: e.attachments.map((a) => ({ tipo: a.type, legenda: a.caption, url: a.url })),
      })),
      comentarios: comments.map((c) => ({ texto: c.content, data: c.createdAt })),
      reacoes: reactions.map((r) => ({ emoji: r.emoji, data: r.createdAt })),
      conversaDoCasal: messages.map((m) => ({
        de: m.senderId === user.id ? "eu" : "parceiro",
        texto: m.content,
        data: m.createdAt,
      })),
      conversasComIA: chat.map((m) => ({ personagem: m.character, quem: m.role, texto: m.content, data: m.createdAt })),
      metas: goals.map((g) => ({ titulo: g.title, emoji: g.emoji, passos: safeJson(g.steps), concluida: g.done })),
      desejos: wishes.map((w) => ({ titulo: w.title, tipo: w.kind, realizado: w.done })),
      capsulas: capsules.map((c) => ({
        titulo: c.title,
        abreEm: c.openAt,
        aberta: !!c.openedAt,
        texto: c.openAt <= new Date() ? c.content : "(ainda lacrada)",
      })),
      resumos: summaries.map((s) => ({ periodo: s.period, dia: s.day, titulo: s.title, mensagem: s.message, dica: s.tip })),
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="enlace-backup-${stamp}.json"`,
        "cache-control": "private, no-store, max-age=0",
        pragma: "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  });
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}
