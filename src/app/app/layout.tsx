import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { serializeMe } from "@/nucleo/usuario-atual";
import { EstruturaAplicativo } from "@/componentes/EstruturaAplicativo";
import { ThemeSync } from "@/componentes/SincronizadorTema";
import { Toaster } from "@/componentes/Avisos";
import { ConfirmHost } from "@/componentes/DialogoConfirmacao";
import { LightboxHost } from "@/componentes/VisualizadorMidia";
import { PinLock } from "@/componentes/BloqueioPin";
import { ProvedorRadio, ReprodutorRadio } from "@/componentes/ReprodutorRadio";
import { GameXPProvider } from "@/componentes/ExperienciaJogos";
import { LiveLocationProvider } from "@/nucleo/localizacao-ao-vivo";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const me = serializeMe(user);

  const unread = user.coupleId
    ? await prisma.message.count({
        where: { coupleId: user.coupleId, senderId: { not: user.id }, readAt: null },
      })
    : 0;

  return (
    <>
      <ThemeSync mode={me.themeMode} light={me.themeLight} dark={me.theme} accent={me.accent} />
      <GameXPProvider>
        <ProvedorRadio>
          <LiveLocationProvider meId={me.id}>
            <EstruturaAplicativo me={me} unread={unread}>{children}</EstruturaAplicativo>
            <Toaster />
            <ConfirmHost />
            <LightboxHost />
            <PinLock enabled={!!user.pinHash} />
            <ReprodutorRadio persistent />
          </LiveLocationProvider>
        </ProvedorRadio>
      </GameXPProvider>
    </>
  );
}
