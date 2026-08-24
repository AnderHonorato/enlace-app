import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { JogosHub } from "@/componentes/CentralJogos";
import { PainelJogo } from "@/componentes/jogos/PainelJogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jogos · Enlace" };

export default async function JogosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return (
    <>
      {/* `useSearchParams` (dentro do PainelJogo) exige um limite de Suspense,
          senão o Next força a página inteira a virar client-side no build. */}
      <Suspense fallback={null}>
        <PainelJogo />
      </Suspense>
      <JogosHub />
    </>
  );
}
