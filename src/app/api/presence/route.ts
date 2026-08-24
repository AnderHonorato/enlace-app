import { prisma } from "@/nucleo/prisma";
import { requireIdentity, json, bad, handle } from "@/nucleo/api";

export const dynamic = "force-dynamic";

const statusFor = (date: Date | null) => {
  if (!date) return "offline";
  const age = (Date.now() - date.getTime()) / 1000;
  return age <= 90 ? "online" : age <= 300 ? "away" : "offline";
};

const serialize = (row: any) => ({
  id: row.id,
  name: row.displayName || row.name,
  avatarColor: row.avatarColor,
  avatarUrl: row.avatarUrl,
  lat: row.liveLat,
  lng: row.liveLng,
  updatedAt: row.locationUpdatedAt?.toISOString() ?? null,
  lastSeenAt: row.locationUpdatedAt?.toISOString() ?? null,
  status: statusFor(row.locationUpdatedAt),
  sharing: row.shareLocation,
});

export async function GET() {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return bad("Conecte-se com seu parceiro primeiro.");
    const rows = await prisma.user.findMany({
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
    const me = rows.find((row) => row.id === user.id) ?? null;
    const partner = rows.find((row) => row.id !== user.id) ?? null;
    return json({ me: me ? serialize(me) : null, partner: partner ? serialize(partner) : null });
  });
}

export async function POST() {
  return handle(async () => {
    const user = await requireIdentity();
    await prisma.user.update({ where: { id: user.id }, data: { locationUpdatedAt: new Date() } });
    return json({ ok: true });
  });
}
