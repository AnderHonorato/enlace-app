import { redirect } from "next/navigation";
import { getUserId } from "@/nucleo/autenticacao";
import { AuthForm } from "@/componentes/FormularioAutenticacao";

export const metadata = { title: "Entrar · Enlace" };

export default async function Page() {
  if (await getUserId()) redirect("/app");
  return <AuthForm mode="login" />;
}
