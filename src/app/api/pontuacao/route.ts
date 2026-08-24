import { z } from "zod";
import { prisma } from "@/nucleo/prisma";
import { requireUser, bad, json, handle } from "@/nucleo/api";
import { diaBR, ultimosDias, inicioSemanaBR, inicioMesBR } from "@/nucleo/pontuacao";

export const runtime = "nodejs";

/**
 * Placar dos jogos do casal.
 *
 * Cada ganho de pontos é uma linha em GameScore — nada é sobrescrito, então
 * "hoje", "semana" e "mês" são só recortes por data da mesma história. Virar o
 * dia ou o mês não zera nada: só muda a janela que a tela está olhando.
 */

const DIAS_NO_GRAFICO = 30;

export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    // Sem casal, o placar é só da pessoa.
    const membros = user.couple?.members ?? [user];
    const ids = membros.map((m) => m.id);

    const hoje = diaBR();
    const semana = inicioSemanaBR();
    const mes = inicioMesBR();
    const dias = ultimosDias(DIAS_NO_GRAFICO);
    const primeiroDoGrafico = dias[0];

    // Uma consulta só, agrupada por pessoa e dia: o resto é contabilidade em
    // memória. Puxar tudo em queries separadas por período custaria 4 idas ao
    // banco para responder a mesma pergunta.
    const [porDia, totais] = await Promise.all([
      prisma.gameScore.groupBy({
        by: ["userId", "dia"],
        where: { userId: { in: ids }, dia: { gte: primeiroDoGrafico } },
        _sum: { points: true },
      }),
      prisma.gameScore.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _sum: { points: true },
        _count: { _all: true },
      }),
    ]);

    const somaDia = new Map<string, number>();
    for (const linha of porDia) {
      somaDia.set(`${linha.userId}|${linha.dia}`, linha._sum.points ?? 0);
    }
    const somaTotal = new Map<string, { pontos: number; partidas: number }>();
    for (const linha of totais) {
      somaTotal.set(linha.userId, {
        pontos: linha._sum.points ?? 0,
        partidas: linha._count._all,
      });
    }

    const jogadores = membros.map((m) => {
      const noPeriodo = (desde: string) =>
        dias.filter((d) => d >= desde).reduce((acc, d) => acc + (somaDia.get(`${m.id}|${d}`) ?? 0), 0);

      const total = somaTotal.get(m.id);
      return {
        id: m.id,
        nome: m.displayName || m.name,
        cor: m.avatarColor,
        avatarUrl: m.avatarUrl,
        euMesmo: m.id === user.id,
        hoje: somaDia.get(`${m.id}|${hoje}`) ?? 0,
        semana: noPeriodo(semana),
        // O mês pode ser mais longo que a janela do gráfico; nesse caso o valor
        // vem do total por dia que temos, então limitamos ao que dá para somar
        // com precisão. Para meses longos isso é resolvido abaixo.
        mes: noPeriodo(mes),
        total: total?.pontos ?? 0,
        partidas: total?.partidas ?? 0,
        serie: dias.map((d) => somaDia.get(`${m.id}|${d}`) ?? 0),
      };
    });

    // Se o mês começou antes da janela do gráfico, a soma acima ficaria curta.
    // Aí sim vale uma consulta extra — mas só nesse caso.
    if (mes < primeiroDoGrafico) {
      const doMes = await prisma.gameScore.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, dia: { gte: mes } },
        _sum: { points: true },
      });
      const mapa = new Map(doMes.map((l) => [l.userId, l._sum.points ?? 0]));
      for (const j of jogadores) j.mes = mapa.get(j.id) ?? 0;
    }

    return json({
      dias,
      hoje,
      jogadores: jogadores.sort((a, b) => b.total - a.total),
    });
  });
}

const schema = z.object({
  game: z.string().trim().min(1).max(40),
  points: z.number().int().min(1).max(500),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.errors[0].message);

    await prisma.gameScore.create({
      data: {
        userId: user.id,
        coupleId: user.coupleId,
        game: parsed.data.game,
        points: parsed.data.points,
        dia: diaBR(),
      },
    });

    return json({ ok: true });
  });
}
