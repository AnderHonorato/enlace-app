import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { characterOf } from "@/nucleo/personagens";
import { ChatRoom } from "@/componentes/SalaConversa";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = characterOf(params.slug);
  return { title: c ? `${c.name} · Enlace` : "Personagem · Enlace" };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ctx?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);
  const character = characterOf(params.slug);
  if (!character) notFound();

  const history = await prisma.chatMessage.findMany({
    where: { userId: user.id, character: character.slug },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <ChatRoom
      character={{
        slug: character.slug,
        name: character.name,
        role: character.role,
        accent: character.accent,
        greeting: character.greeting,
        suggestions: character.suggestions,
      }}
      initial={history.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))}
      hasKey={me.hasAiKey}
      opener={typeof searchParams.ctx === "string" ? searchParams.ctx.slice(0, 400) : undefined}
    />
  );
}
