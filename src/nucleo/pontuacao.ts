import "server-only";

/**
 * Datas da pontuação dos jogos.
 *
 * Tudo aqui é calculado no fuso de Brasília, e não em UTC, porque o dia da
 * pessoa acaba à meia-noite dela. Com UTC, a "pontuação de hoje" virava às 21h
 * e o casal via o placar zerar no meio da noite.
 */

const FUSO_BR_MS = 3 * 60 * 60 * 1000;

/** Data "AAAA-MM-DD" no fuso de Brasília. */
export function diaBR(d: Date = new Date()): string {
  return new Date(d.getTime() - FUSO_BR_MS).toISOString().slice(0, 10);
}

/** Lista dos últimos `n` dias, do mais antigo para o mais novo. */
export function ultimosDias(n: number, hoje: Date = new Date()): string[] {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dias.push(diaBR(new Date(hoje.getTime() - i * 86_400_000)));
  }
  return dias;
}

/**
 * Primeiro dia da semana (segunda-feira). Semana começando no domingo daria a
 * sensação de "semana nova" no domingo à noite, que não é como as pessoas
 * pensam a semana por aqui.
 */
export function inicioSemanaBR(hoje: Date = new Date()): string {
  const local = new Date(hoje.getTime() - FUSO_BR_MS);
  const diaDaSemana = (local.getUTCDay() + 6) % 7; // 0 = segunda
  return diaBR(new Date(hoje.getTime() - diaDaSemana * 86_400_000));
}

/** Primeiro dia do mês corrente, no fuso de Brasília. */
export function inicioMesBR(hoje: Date = new Date()): string {
  return diaBR(hoje).slice(0, 8) + "01";
}
