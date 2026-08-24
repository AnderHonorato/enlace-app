import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { allTrophies, trophySummary, serializeTrophy } from "@/nucleo/conquistas";
import { trophyInput } from "@/nucleo/dados-trofeus";
import { TrophyHall } from "@/componentes/SalaTrofeus";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hall de Troféus · Enlace" };

export default async function TrofeusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const input = await trophyInput({ id: user.id, coupleId: user.coupleId, points: user.points });
  const trophies = allTrophies(input);
  const summary = trophySummary(trophies);

  // Serializa antes de cruzar para o Client Component: o TrophyState carrega
  // funções (goal/current/desc) que não podem ser passadas na fronteira.
  return <TrophyHall trophies={trophies.map(serializeTrophy)} summary={summary} />;
}
