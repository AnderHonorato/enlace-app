import { prisma } from "@/nucleo/prisma";
import { requireUser, json, bad, handle } from "@/nucleo/api";

export const dynamic = "force-dynamic";

/** Obtém as localizações dos dois parceiros. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!user.coupleId) return bad("Conecte-se com seu parceiro primeiro.");

    const rows = await prisma.$queryRawUnsafe<
      { id: string; name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null; liveLat: number | null; liveLng: number | null; locationUpdatedAt: string | null; shareLocation: number }[]
    >(
      `SELECT id, name, displayName, avatarColor, avatarUrl, liveLat, liveLng, locationUpdatedAt, shareLocation FROM User WHERE coupleId = ?`,
      user.coupleId
    );

    const partner = rows.find((r) => r.id !== user.id);
    const me = rows.find((r) => r.id === user.id);

    return json({
      me: me
        ? {
            id: me.id,
            name: me.displayName || me.name,
            avatarColor: me.avatarColor,
            avatarUrl: me.avatarUrl,
            lat: me.liveLat,
            lng: me.liveLng,
            updatedAt: me.locationUpdatedAt,
            sharing: !!me.shareLocation,
          }
        : null,
      partner: partner
        ? {
            id: partner.id,
            name: partner.displayName || partner.name,
            avatarColor: partner.avatarColor,
            avatarUrl: partner.avatarUrl,
            lat: partner.liveLat,
            lng: partner.liveLng,
            updatedAt: partner.locationUpdatedAt,
            sharing: !!partner.shareLocation,
          }
        : null,
    });
  });
}

/** Atualiza minha localização e status de compartilhamento. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { lat, lng, sharing } = body;

    if (sharing === false || sharing === true) {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET shareLocation = ? WHERE id = ?`,
        sharing ? 1 : 0,
        user.id
      );
    }

    if (typeof lat === "number" && typeof lng === "number") {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET liveLat = ?, liveLng = ?, locationUpdatedAt = datetime('now') WHERE id = ?`,
        lat,
        lng,
        user.id
      );
    }

    return json({ ok: true });
  });
}
