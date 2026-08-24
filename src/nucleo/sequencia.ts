import "server-only";
import { prisma } from "./prisma";
import { notify } from "./notificacoes";

const PENALTY_PER_DAY = 8; // pontos perdidos por dia sem atividade
const PENALTY_CAP = 40;
const WEEK_BONUS = 15; // bônus a cada 7 dias seguidos
const SHIELD_CAP = 2; // no máximo 2 escudos guardados

export function streakDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function diffDays(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}

export type StreakResult = {
  streak: number;
  penalty: number;
  missed: number;
  bonus: number;
  alreadyToday: boolean;
  /** Um escudo foi consumido para salvar a sequência agora. */
  shieldUsed: boolean;
  /** Escudos restantes depois desta ação. */
  shields: number;
};

/**
 * Registra atividade do dia.
 *
 * Regras:
 *  - Escudo é reabastecido em +1 no primeiro dia ativo de cada mês (limite 2).
 *  - Faltou exatamente 1 dia e há escudo? Consome o escudo, a sequência
 *    continua e NÃO há penalidade.
 *  - Faltou mais de 1 dia (ou sem escudo)? Penalidade e a sequência reinicia.
 *  - A cada 7 dias seguidos, ganha um bônus de pontos.
 */
export async function touchStreak(userId: string): Promise<StreakResult> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, bestStreak: true, lastActiveDay: true, points: true, streakShields: true, shieldMonth: true },
  });
  if (!u) return { streak: 0, penalty: 0, missed: 0, bonus: 0, alreadyToday: false, shieldUsed: false, shields: 0 };

  const today = streakDayKey();

  // Reabastece o escudo no primeiro acesso de um mês novo.
  const thisMonth = monthKey();
  let shields = u.streakShields;
  let shieldMonth = u.shieldMonth;
  if (shieldMonth !== thisMonth) {
    shields = Math.min(SHIELD_CAP, shields + 1);
    shieldMonth = thisMonth;
  }

  if (u.lastActiveDay === today) {
    // Já registrou hoje — só persiste um eventual refil de escudo.
    if (shieldMonth !== u.shieldMonth || shields !== u.streakShields) {
      await prisma.user.update({ where: { id: userId }, data: { streakShields: shields, shieldMonth } });
    }
    return { streak: u.streak, penalty: 0, missed: 0, bonus: 0, alreadyToday: true, shieldUsed: false, shields };
  }

  let newStreak = 1;
  let penalty = 0;
  let missed = 0;
  let shieldUsed = false;

  if (u.lastActiveDay) {
    const gap = diffDays(u.lastActiveDay, today);
    if (gap === 1) {
      newStreak = u.streak + 1;
    } else if (gap === 2 && shields > 0) {
      // Faltou 1 dia, mas o escudo salva a sequência.
      shields -= 1;
      shieldUsed = true;
      newStreak = u.streak + 1;
    } else if (gap > 1) {
      missed = gap - 1;
      penalty = Math.min(missed * PENALTY_PER_DAY, PENALTY_CAP);
      newStreak = 1;
    } else {
      newStreak = Math.max(1, u.streak);
    }
  }

  const bonus = newStreak > 0 && newStreak % 7 === 0 ? WEEK_BONUS : 0;
  const points = Math.max(0, u.points + bonus - penalty);

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      bestStreak: Math.max(u.bestStreak, newStreak),
      lastActiveDay: today,
      points,
      streakShields: shields,
      shieldMonth,
    },
  });

  // Avisa quando o escudo salvou a sequência — mesmo que a ação não mostre toast.
  if (shieldUsed) {
    notify({
      userId,
      kind: "streak",
      title: "Escudo usado! 🛡️",
      body: `Você faltou um dia, mas seu escudo salvou a sequência de ${newStreak} dias.`,
      url: "/app",
      emoji: "🛡️",
      push: false, // é sobre a própria ação; não precisa de push
    }).catch(() => {});
  }

  return { streak: newStreak, penalty, missed, bonus, alreadyToday: false, shieldUsed, shields };
}

/** Estado da sequência para exibir lembretes (sem alterar nada). */
export function streakStatus(
  lastActiveDay: string | null,
  streak: number,
  shields = 0,
  shieldMonth: string | null = null
) {
  const today = streakDayKey();
  const yesterday = streakDayKey(new Date(Date.now() - 86400000));
  const activeToday = lastActiveDay === today;
  const alive = lastActiveDay === today || lastActiveDay === yesterday;

  // Escudos que o usuário efetivamente tem hoje (contando o refil do mês).
  const effShields = shieldMonth === monthKey() ? shields : Math.min(SHIELD_CAP, shields + 1);

  return {
    activeToday,
    streak: alive ? streak : 0,
    atRisk: !activeToday, // ainda não registrou hoje
    shields: effShields,
    // Mesmo sem registrar hoje, a sequência está protegida se houver escudo.
    protected: !activeToday && alive && effShields > 0,
  };
}
