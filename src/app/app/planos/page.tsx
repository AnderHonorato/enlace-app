import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { serializeGoal, serializeWish, serializeCapsule } from "@/nucleo/planos";
import { Planos } from "@/componentes/Planos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos · Enlace" };

export default async function PlanosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  if (!user.coupleId) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Link2 size={26} />
        </div>
        <h1 className="font-display text-3xl text-text">Planos de vocês</h1>
        <p className="mt-2 max-w-xs text-muted">
          Metas, desejos e cápsulas do tempo são compartilhados entre vocês. Conecte-se com seu amor primeiro.
        </p>
        <Link href="/app/config" className="mt-5 rounded-full accent-gradient px-6 py-3 font-semibold text-white shadow-glow">
          Conectar agora
        </Link>
      </div>
    );
  }

  const [goals, wishes, capsules] = await Promise.all([
    prisma.goal.findMany({ where: { coupleId: user.coupleId }, orderBy: [{ done: "asc" }, { createdAt: "desc" }] }),
    prisma.wish.findMany({ where: { coupleId: user.coupleId }, orderBy: [{ done: "asc" }, { createdAt: "desc" }] }),
    prisma.capsule.findMany({ where: { coupleId: user.coupleId }, include: { items: true }, orderBy: { openAt: "asc" } }),
  ]);

  return (
    <Planos
      initialGoals={goals.map(serializeGoal)}
      initialWishes={wishes.map(serializeWish)}
      initialCapsules={capsules.map((c) => serializeCapsule(c, user.id))}
    />
  );
}
