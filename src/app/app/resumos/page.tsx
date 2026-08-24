import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { ResumosList } from "@/componentes/ListaResumos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumos · Enlace" };

export default async function ResumosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);

  const rows = user.coupleId
    ? await prisma.dailySummary.findMany({
        where: { coupleId: user.coupleId },
        orderBy: { day: "desc" },
        take: 90,
      })
    : [];

  const summaries = rows.map((s) => ({
    id: s.id,
    day: s.day,
    vibe: s.vibe as "positive" | "neutral" | "attention",
    title: s.title,
    message: s.message,
    tip: s.tip,
    createdAt: s.createdAt.toISOString(),
  }));

  const names =
    me.couple?.name ||
    (me.partner
      ? `${me.displayName || me.name} & ${me.partner.displayName || me.partner.name}`
      : me.displayName || me.name);

  return <ResumosList summaries={summaries} names={names} />;
}
