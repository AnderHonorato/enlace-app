import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { DARK_KEYS, LIGHT_KEYS, ACCENT_KEYS } from "@/nucleo/temas";

const schema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  displayName: z.string().trim().max(40).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  avatarUrl: z.string().max(2_000_000).nullable().optional(),
  birthday: z.string().datetime().nullable().optional(),
  theme: z.enum(DARK_KEYS as [string, ...string[]]).optional(),
  themeLight: z.enum(LIGHT_KEYS as [string, ...string[]]).optional(),
  themeMode: z.enum(["auto", "light", "dark"]).optional(),
  accent: z.enum(ACCENT_KEYS as [string, ...string[]]).optional(),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: d.name,
        displayName: d.displayName !== undefined ? d.displayName : undefined,
        bio: d.bio !== undefined ? d.bio : undefined,
        avatarColor: d.avatarColor,
        avatarUrl: d.avatarUrl !== undefined ? d.avatarUrl : undefined,
        birthday:
          d.birthday === undefined ? undefined : d.birthday ? new Date(d.birthday) : null,
        theme: d.theme,
        themeLight: d.themeLight,
        themeMode: d.themeMode,
        accent: d.accent,
      },
    });
    return json({ ok: true });
  });
}
