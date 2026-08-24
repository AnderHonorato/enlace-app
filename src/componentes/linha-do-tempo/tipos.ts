import type { EntryDTO } from "@/nucleo/memorias";
import type { MascotState } from "@/nucleo/mascote";
import type { Mission } from "@/nucleo/desafios";
import type { Me } from "@/nucleo/usuario-atual";
import type { Summary } from "../CartaoResumo";
import type { StreakInfo } from "../LembreteSequencia";

export type PropriedadesLinhaDoTempo = {
  initial: EntryDTO[];
  initialTotal: number;
  initialNextCursor: string | null;
  me: Me;
  summaryToday?: Summary | null;
  names?: string;
  streakInfo?: StreakInfo;
  onThisDay?: EntryDTO[];
  challenge?: { emoji: string; title: string; desc: string };
  challengeDone?: boolean;
  missions?: Mission[];
  missionDoneTags?: string[];
  lastFeedSeenAt?: string | null;
  mascot?: { state: MascotState; name: string | null };
};
