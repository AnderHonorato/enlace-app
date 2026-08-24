import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { serializeMe } from "@/nucleo/usuario-atual";
import { EditorMemoria } from "@/componentes/EditorMemoria";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova memória · Enlace" };

export default async function NovoPage({
  searchParams,
}: {
  searchParams: { desafio?: string; pergunta?: string; missao?: string; tag?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.slice(0, 140) : undefined);
  const desafio = str(searchParams.desafio);
  const pergunta = str(searchParams.pergunta);
  const missao = str(searchParams.missao);
  // A tag decide se a missão conta como cumprida na home, então ela precisa
  // chegar até o composer — não só o título.
  const tag = str(searchParams.tag)?.toLowerCase().replace(/[^a-z0-9à-ÿ-]/gi, "");

  return (
    <EditorMemoria
      me={serializeMe(user)}
      challengeTitle={pergunta ?? missao ?? desafio}
      promptTag={tag ?? (pergunta ? "pergunta" : missao ? "missao" : desafio ? "desafio" : undefined)}
    />
  );
}
