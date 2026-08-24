import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { prisma } from "@/nucleo/prisma";
import { authorSelect } from "@/nucleo/memorias";
import { CoupleChat } from "@/componentes/ConversaCasal";
import { serializeChatMessage } from "@/nucleo/conversa";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversa · Enlace" };

export default async function ConversaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);

  if (!me.couple) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Link2 size={26} />
        </div>
        <h1 className="font-display text-3xl text-text">Conversa de vocês</h1>
        <p className="mt-2 max-w-xs text-muted">
          Conecte-se com seu amor para trocar mensagens, fotos, vídeos e áudios em um espaço só de vocês.
        </p>
        <Link href="/app/config" className="mt-5 rounded-full accent-gradient px-6 py-3 font-semibold text-white shadow-glow">
          Conectar agora
        </Link>
      </div>
    );
  }

  // Abrir a conversa marca as mensagens recebidas como lidas.
  await prisma.message.updateMany({
    where: { coupleId: me.couple.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const rows = await prisma.message.findMany({
    where: { coupleId: me.couple.id },
    include: { sender: { select: authorSelect } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const initial = rows.reverse().map((message) => serializeChatMessage(message, user.id));

  return <CoupleChat me={me} initial={initial} />;
}
