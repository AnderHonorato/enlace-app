import { redirect } from "next/navigation";
import { getUserId } from "@/nucleo/autenticacao";
import { Landing } from "@/componentes/PaginaInicialPublica";

export default async function Home() {
  const uid = await getUserId();
  if (uid) redirect("/app");
  return <Landing />;
}
