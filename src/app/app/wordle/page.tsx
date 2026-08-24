import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { Wordle } from "@/componentes/Wordle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Palavra do casal · Enlace" };

export default async function WordlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const me = {
    id: user.id,
    name: user.displayName || user.name,
    avatarColor: user.avatarColor,
  };

  let partner: { id: string; name: string; avatarColor: string } | null = null;
  if (user.coupleId) {
    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      include: {
        members: {
          where: { id: { not: user.id } },
          select: { id: true, name: true, displayName: true, avatarColor: true },
        },
      },
    });
    const p = couple?.members[0];
    if (p) {
      partner = { id: p.id, name: p.displayName || p.name, avatarColor: p.avatarColor };
    }
  }

  return <Wordle me={me} partner={partner} />;
}
