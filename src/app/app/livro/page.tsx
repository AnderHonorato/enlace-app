import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { entryInclude, serializeEntry, feedWhere } from "@/nucleo/memorias";
import { Livro } from "@/componentes/Livro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nosso livro · Enlace" };

export default async function LivroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);

  const entries = await prisma.entry.findMany({
    where: feedWhere({ id: user.id, coupleId: user.coupleId }),
    include: entryInclude,
    orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
    take: 500,
  });

  const names =
    me.couple?.name ||
    (me.partner
      ? `${me.displayName || me.name} & ${me.partner.displayName || me.partner.name}`
      : me.displayName || me.name);

  return (
    <Livro
      entries={entries.map((e) => serializeEntry(e, user.id))}
      names={names}
      howWeMet={me.couple?.howWeMet ?? null}
      anniversary={me.couple?.anniversary ?? null}
    />
  );
}
