import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { RadioPage } from "@/componentes/PaginaRadio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rádio · Enlace" };

export default async function RadioRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return <RadioPage coupled={!!user.coupleId} />;
}
