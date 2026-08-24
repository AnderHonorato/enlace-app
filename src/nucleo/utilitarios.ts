import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function fmtDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function fmtTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "HH:mm", { locale: ptBR });
}

export function relTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function daysSince(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.max(0, differenceInCalendarDays(new Date(), date));
}

/** Data curta, ex: "12 de mar. de 2026". */
export function fmtDateShort(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d 'de' MMM 'de' yyyy", { locale: ptBR });
}

/**
 * A memória foi escrita para um dia diferente daquele em que foi publicada?
 * Compara o dia do calendário, não as horas — postar às 23h50 sobre "hoje"
 * e salvar às 00h05 não conta como retroativo.
 */
export function isRetroactive(entryDate: Date | string, createdAt: Date | string) {
  const a = typeof entryDate === "string" ? new Date(entryDate) : entryDate;
  const b = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return format(a, "yyyy-MM-dd") !== format(b, "yyyy-MM-dd");
}
