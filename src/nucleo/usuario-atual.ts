import type { CurrentUser } from "./autenticacao";
import { levelFromPoints } from "./pontos";
import { userHasKey } from "./chave-ia";

export type Me = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  avatarColor: string;
  avatarUrl: string | null;
  bio: string | null;
  theme: string;
  themeLight: string;
  themeMode: string;
  accent: string;
  points: number;
  streak: number;
  couple: {
    id: string;
    name: string | null;
    inviteCode: string;
    anniversary: string | null;
    metDate: string | null;
    howWeMet: string | null;
    memberCount: number;
    connectionPoints: number;
    level: number;
  } | null;
  birthday: string | null;
  partner: {
    id: string;
    name: string;
    displayName: string | null;
    avatarColor: string;
    avatarUrl: string | null;
    bio: string | null;
    birthday: string | null;
  } | null;
  hasAiKey: boolean;
};

export function serializeMe(user: CurrentUser): Me {
  const partner = user.couple?.members.find((m) => m.id !== user.id) ?? null;
  const connectionPoints = user.couple
    ? user.couple.members.reduce((s, m) => s + (m.points ?? 0), 0)
    : user.points;
  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    theme: user.theme,
    themeLight: user.themeLight,
    themeMode: user.themeMode,
    accent: user.accent,
    points: user.points,
    streak: user.streak,
    couple: user.couple
      ? {
          id: user.couple.id,
          name: user.couple.name,
          inviteCode: user.couple.inviteCode,
          anniversary: user.couple.anniversary ? user.couple.anniversary.toISOString() : null,
          metDate: user.couple.metDate ? user.couple.metDate.toISOString() : null,
          howWeMet: user.couple.howWeMet,
          memberCount: user.couple.members.length,
          connectionPoints,
          level: levelFromPoints(connectionPoints),
        }
      : null,
    birthday: user.birthday ? user.birthday.toISOString() : null,
    partner: partner
      ? {
          id: partner.id,
          name: partner.name,
          displayName: partner.displayName,
          avatarColor: partner.avatarColor,
          avatarUrl: partner.avatarUrl,
          bio: partner.bio,
          birthday: partner.birthday ? partner.birthday.toISOString() : null,
        }
      : null,
    hasAiKey: userHasKey(user),
  };
}
