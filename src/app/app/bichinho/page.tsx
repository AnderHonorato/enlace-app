import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { mascotData } from "@/nucleo/dados-mascote";
import { BichinhoPage } from "@/componentes/PaginaBichinho";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bichinho · Enlace" };

export default async function BichinhoRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { state, name } = await mascotData({
    id: user.id,
    coupleId: user.coupleId,
    points: user.points,
    streak: user.streak,
    bestStreak: user.bestStreak,
    lastActiveDay: user.lastActiveDay,
  });

  return <BichinhoPage state={state} name={name} coupled={!!user.coupleId} />;
}
