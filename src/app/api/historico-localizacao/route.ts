import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { bad, handle, json, requireUser } from "@/nucleo/api";
import { usuarioEhAdministrador } from "@/nucleo/historico-localizacao-servidor";
import { detectarParadas, type PontoTrajeto } from "@/nucleo/trajeto-localizacao";

export const dynamic = "force-dynamic";

const consultaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().min(1),
});

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!(await usuarioEhAdministrador(user.id))) return bad("Acesso restrito ao administrador.", 403);
    if (!user.coupleId) return bad("Conecte-se com seu parceiro primeiro.");

    const url = new URL(req.url);
    const parsed = consultaSchema.safeParse({
      data: url.searchParams.get("data"),
      userId: url.searchParams.get("userId"),
    });
    if (!parsed.success) return bad("Informe uma data e um usuário válidos.");

    const alvo = await prisma.user.findFirst({
      where: { id: parsed.data.userId, coupleId: user.coupleId },
      select: { id: true, name: true, displayName: true, avatarColor: true },
    });
    if (!alvo) return bad("Usuário não encontrado.", 404);

    const inicio = new Date(`${parsed.data.data}T00:00:00-03:00`);
    const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
    const registros = await prisma.pontoLocalizacao.findMany({
      where: { userId: alvo.id, registradoEm: { gte: inicio, lt: fim } },
      orderBy: { registradoEm: "asc" },
      take: 3_000,
      select: { id: true, lat: true, lng: true, precisao: true, registradoEm: true },
    });
    const pontos: PontoTrajeto[] = registros.map((ponto) => ({
      id: ponto.id,
      lat: ponto.lat,
      lng: ponto.lng,
      registradoEm: ponto.registradoEm.toISOString(),
    }));

    return json({
      usuario: {
        id: alvo.id,
        nome: alvo.displayName || alvo.name,
        avatarColor: alvo.avatarColor,
      },
      data: parsed.data.data,
      pontos: registros.map((ponto) => ({
        id: ponto.id,
        lat: ponto.lat,
        lng: ponto.lng,
        precisao: ponto.precisao,
        registradoEm: ponto.registradoEm.toISOString(),
      })),
      paradas: detectarParadas(pontos),
    });
  });
}
