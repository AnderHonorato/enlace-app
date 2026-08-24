import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { entryInclude, serializeEntry } from "@/nucleo/memorias";
import { EditorMemoria } from "@/componentes/EditorMemoria";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar memória · Enlace" };

export default async function EditarPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);
  const entry = await prisma.entry.findUnique({ where: { id: params.id }, include: entryInclude });
  if (!entry || entry.authorId !== user.id) notFound();
  // Editar o DTO oculto substituiria texto e anexos por vazio. A memória deve
  // ser realmente destrancada na Home antes de entrar no editor.
  if (entry.locked) redirect(`/app?memoria=${entry.id}`);
  return <EditorMemoria me={me} initial={serializeEntry(entry, user.id)} />;
}
