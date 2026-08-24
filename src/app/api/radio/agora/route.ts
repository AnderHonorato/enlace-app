export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireIdentity, bad, json, handle } from "@/nucleo/api";

/**
 * "Tocando agora" da rádio do casal.
 *
 * O QUE está tocando é do casal (compartilhado, como `Couple.typing`); SE está
 * tocando é de cada um (local, nunca sobe pra cá — ver `RadioPlayer.tsx`).
 * Quando Ana escolhe uma faixa, João só fica sabendo que ela escolheu; o
 * áudio dele continua sob o controle dele, incluindo pausar sem afetar Ana.
 *
 * Guardamos num campo JSON em `Couple` pelo mesmo motivo do `typing`: é um
 * único registro por casal, não precisa de tabela própria, e `prisma db push`
 * fica aditivo (sem migração).
 */

type Agora = {
  trackId: string;
  trackName: string;
  artist: string;
  image: string | null;
  startedBy: string;
  at: string;
};

function parse(raw: string | null | undefined): Agora | null {
  try {
    const v = JSON.parse(raw || "{}");
    if (v && typeof v.trackId === "string" && v.trackId) return v as Agora;
  } catch {}
  return null;
}

/** Devolve a faixa que o casal está ouvindo agora (ou null). */
export async function GET() {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return json({ track: null });

    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      select: { nowPlaying: true },
    });

    return json({ track: parse(couple?.nowPlaying) });
  });
}

const setSchema = z.object({
  trackId: z.string().min(1).max(64),
  trackName: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  image: z.string().max(600).nullable().optional(),
});

/**
 * Escolhe a faixa que o casal está ouvindo agora.
 *
 * Se a faixa já era a que estava tocando, mantém quem começou e quando —
 * senão, quem apenas retoma uma música que o par já tinha escolhido "roubaria"
 * o crédito de tê-la começado toda vez que apertasse o play.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireIdentity();
    if (!user.coupleId) return bad("Conecte-se com seu amor para compartilhar a rádio.");

    const body = await req.json().catch(() => ({}));
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);
    const d = parsed.data;

    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      select: { nowPlaying: true },
    });
    const existing = parse(couple?.nowPlaying);

    const agora: Agora =
      existing && existing.trackId === d.trackId
        ? { ...existing, trackName: d.trackName, artist: d.artist, image: d.image ?? null }
        : {
            trackId: d.trackId,
            trackName: d.trackName,
            artist: d.artist,
            image: d.image ?? null,
            startedBy: user.id,
            at: new Date().toISOString(),
          };

    await prisma.couple.update({
      where: { id: user.coupleId },
      data: { nowPlaying: JSON.stringify(agora) },
    });

    return json({ track: agora });
  });
}
