import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { LiveCoupleMap } from "@/componentes/MapaCasalAoVivo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ao vivo · Enlace" };

export default async function AoVivoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const me = serializeMe(user);

  return (
    <LiveCoupleMap
      me={{
        id: me.id,
        name: me.name,
        displayName: me.displayName,
        avatarColor: me.avatarColor,
        avatarUrl: me.avatarUrl,
      }}
      partner={me.partner}
    />
  );
}
