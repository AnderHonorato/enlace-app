import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { Roleta } from "@/componentes/Roleta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roleta · Enlace" };

export default async function RoletaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return <Roleta coupled={!!user.coupleId} />;
}
