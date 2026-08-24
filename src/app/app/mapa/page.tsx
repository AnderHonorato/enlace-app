import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { feedWhere } from "@/nucleo/memorias";
import { toPlain } from "@/nucleo/sanitizacao";
import { MemoryMap, type MapPin } from "@/componentes/MapaMemorias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapa · Enlace" };

export default async function MapaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const entries = await prisma.entry.findMany({
    where: {
      ...feedWhere({ id: user.id, coupleId: user.coupleId }),
      lat: { not: null },
      lng: { not: null },
      locked: false, // memórias trancadas não aparecem no mapa
    },
    select: {
      id: true,
      title: true,
      content: true,
      place: true,
      lat: true,
      lng: true,
      entryDate: true,
      mood: true,
      author: { select: { displayName: true, name: true } },
      attachments: { where: { type: "image" }, select: { url: true }, take: 1 },
    },
    orderBy: { entryDate: "desc" },
    take: 300,
  });

  const pins: MapPin[] = entries.map((e) => ({
    id: e.id,
    lat: e.lat!,
    lng: e.lng!,
    title: e.title || toPlain(e.content).slice(0, 60) || "Memória",
    place: e.place,
    mood: e.mood,
    author: e.author.displayName || e.author.name,
    date: e.entryDate.toISOString(),
    content: toPlain(e.content).slice(0, 4000),
    photoUrl: e.attachments[0]?.url ?? null,
  }));

  return <MemoryMap pins={pins} />;
}
