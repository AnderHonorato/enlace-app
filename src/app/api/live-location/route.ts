import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, requireSameOrigin, json, bad, handle } from "@/nucleo/api";

export const dynamic = "force-dynamic";

const localizacaoSchema = z
  .object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    sharing: z.boolean().optional(),
  })
  .refine((dados) => (dados.lat === undefined) === (dados.lng === undefined), {
    message: "Latitude e longitude precisam ser enviadas juntas.",
  });

function apresentarLocalizacao(usuario: {
  id: string;
  name: string;
  displayName: string | null;
  avatarColor: string;
  avatarUrl: string | null;
  liveLat: number | null;
  liveLng: number | null;
  locationUpdatedAt: Date | null;
  shareLocation: boolean;
}) {
  const compartilhando = usuario.shareLocation === true;

  return {
    id: usuario.id,
    name: usuario.displayName || usuario.name,
    avatarColor: usuario.avatarColor,
    avatarUrl: usuario.avatarUrl,
    lat: compartilhando ? usuario.liveLat : null,
    lng: compartilhando ? usuario.liveLng : null,
    updatedAt: compartilhando ? usuario.locationUpdatedAt : null,
    sharing: compartilhando,
  };
}

/** Obtém as localizações sem expor coordenadas de quem desativou o compartilhamento. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu parceiro primeiro.");

    const usuarios = await prisma.user.findMany({
      where: { coupleId: user.coupleId },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarColor: true,
        avatarUrl: true,
        liveLat: true,
        liveLng: true,
        locationUpdatedAt: true,
        shareLocation: true,
      },
    });

    const partner = usuarios.find((item) => item.id !== user.id);
    const me = usuarios.find((item) => item.id === user.id);

    return json({
      me: me ? apresentarLocalizacao(me) : null,
      partner: partner ? apresentarLocalizacao(partner) : null,
    });
  });
}

/** Atualiza minha localização e status de compartilhamento. */
export async function POST(req: Request) {
  return handle(async () => {
    requireSameOrigin(req);
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = localizacaoSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    const { lat, lng, sharing } = parsed.data;

    if (sharing === false) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          shareLocation: false,
          liveLat: null,
          liveLng: null,
          locationUpdatedAt: null,
        },
      });
      return json({ ok: true, sharing: false });
    }

    const estadoAtual =
      sharing === true
        ? true
        : (
            await prisma.user.findUnique({
              where: { id: user.id },
              select: { shareLocation: true },
            })
          )?.shareLocation === true;

    const temCoordenadas = lat !== undefined && lng !== undefined;
    if (temCoordenadas && !estadoAtual) {
      return bad("Ative o compartilhamento antes de enviar sua localização.", 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(sharing === true ? { shareLocation: true } : {}),
        ...(temCoordenadas
          ? {
              liveLat: lat,
              liveLng: lng,
              locationUpdatedAt: new Date(),
            }
          : {}),
      },
    });

    return json({ ok: true, sharing: sharing ?? estadoAtual });
  });
}
