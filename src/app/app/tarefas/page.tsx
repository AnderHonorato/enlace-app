import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { serializeTarefa } from "@/nucleo/tarefas";
import { Tarefas } from "@/componentes/Tarefas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarefas · Enlace" };

export default async function TarefasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  if (!user.coupleId) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Link2 size={26} />
        </div>
        <h1 className="font-display text-3xl text-text">Tarefas de vocês</h1>
        <p className="mt-2 max-w-xs text-muted">
          Listas compartilhadas com tarefas, comentários e anexos. Conecte-se com seu amor primeiro.
        </p>
        <Link href="/app/config" className="mt-5 rounded-full accent-gradient px-6 py-3 font-semibold text-white shadow-glow">
          Conectar agora
        </Link>
      </div>
    );
  }

  const lists = await prisma.taskList.findMany({
    where: { coupleId: user.coupleId },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const initial = lists.map((l) => ({
    id: l.id,
    title: l.title,
    tasks: l.tasks.map((t) => serializeTarefa(t, user.id)),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return <Tarefas initial={initial} />;
}
