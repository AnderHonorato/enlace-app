import { redirect } from "next/navigation";
import { getCurrentUser } from "@/nucleo/autenticacao";
import { prisma } from "@/nucleo/prisma";
import { feedWhere } from "@/nucleo/memorias";
import { AlbumGallery, type AlbumPhoto } from "@/componentes/GaleriaAlbum";

export const dynamic = "force-dynamic";
export const metadata = { title: "Álbum · Enlace" };

export default async function AlbumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const where = feedWhere({ id: user.id, coupleId: user.coupleId });

  const entries = await prisma.entry.findMany({
    where: { ...where, locked: false }, // memórias trancadas ficam fora do álbum
    select: {
      id: true,
      title: true,
      entryDate: true,
      attachments: { where: { type: "image" }, select: { id: true, url: true } },
      author: { select: { displayName: true, name: true } },
    },
    orderBy: { entryDate: "desc" },
    take: 400,
  });

  const photos: AlbumPhoto[] = [];
  for (const e of entries) {
    for (const a of e.attachments) {
      photos.push({
        id: a.id,
        url: a.url,
        entryId: e.id,
        title: e.title,
        author: e.author.displayName || e.author.name,
        date: e.entryDate.toISOString(),
      });
    }
  }

  return <AlbumGallery photos={photos} />;
}
