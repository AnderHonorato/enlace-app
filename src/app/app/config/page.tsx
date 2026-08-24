import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { Configuracoes } from "@/componentes/Configuracoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Você · Enlace" };

export default async function ConfigPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return <Configuracoes me={serializeMe(user)} />;
}
