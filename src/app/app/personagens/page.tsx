import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { CharacterGrid } from "@/componentes/GradePersonagens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personagens · Enlace" };

export default async function PersonagensPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return <CharacterGrid hasKey={serializeMe(user).hasAiKey} />;
}
