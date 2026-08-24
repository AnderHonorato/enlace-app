import type { Achievement } from "@/nucleo/conquistas";
import type { Ambience, JourneyPlace, RetroAppStats, TimelineItem } from "../CenasRetrospectiva";

export type FotoRetrospectiva = { url: string; title: string | null; date: string; author: string };

export type MusicaRetrospectivaSalva = {
  id: string;
  slideKey: string | null;
  trackId: string;
  trackName: string;
  artist: string;
  image: string | null;
};

export type ResultadoBuscaMusica = {
  id: string;
  name: string;
  artist: string;
  image: string | null;
};

export type DadosRetrospectiva = {
  year: number;
  allTime: boolean;
  names: string;
  total: number;
  words: number;
  photos: FotoRetrospectiva[];
  photosCount?: number;
  likes: number;
  comments: number;
  places: number;
  topMood: { emoji: string; label: string; color: string; count: number } | null;
  busiestMonth: { name: string; count: number } | null;
  authors: { name: string; count: number }[];
  topTags: string[];
  level: number;
  points: number;
  loveTitle: { title: string; emoji: string };
  daysTogether: number | null;
  topEntry: { title: string; excerpt: string; author: string; photo: string | null; likes: number } | null;
  metDate: string | null;
  anniversary: string | null;
  coupleName: string | null;
  questions: { for: string; name: string; q: string; options: string[] }[];
  allPhotos: FotoRetrospectiva[];
  capsules?: { title: string | null; openAt: string }[];

  // ── Novos blocos da retrospectiva ──
  /** Conquistas atuais calculadas com os dados visíveis da retrospectiva. */
  achievements?: Achievement[];
  /** Marcos em ordem cronológica para a linha do tempo. */
  timeline?: TimelineItem[];
  /** Lugares registrados, do mais frequente para o menos. */
  placeList?: JourneyPlace[];
  /** Registros feitos depois da meia-noite. */
  lateNights?: number;
  /** Maior sequência de dias com registro. */
  bestStreak?: number;
  /** Meses distintos com registro. */
  activeMonths?: number;
  /** Palavra secreta do casal para o slide estilo Wordle. */
  wordleWord?: string | null;
  /** Opções da roleta surpresa do casal (desejos/ideias). */
  roletaOptions?: string[];
  /** Primeira memória registrada, para o slide de origem. */
  firstEntry?: { title: string; date: string; author: string; photo: string | null } | null;
  /** Atividade agregada dos módulos do app; nunca contém conteúdo privado. */
  appStats?: RetroAppStats;
};

export type CenaRetrospectiva = {
  key: string;
  grad: [string, string];
  eyebrow?: string;
  big?: string;
  title: string;
  sub?: string;
  emoji?: string;
  photo?: string | null;
  photos?: FotoRetrospectiva[];
  layout?:
    | "text"
    | "polaroid"
    | "collage"
    | "filmstrip"
    | "mural"
    | "starmap"
    | "moon"
    | "counter"
    | "achievements"
    | "timeline"
    | "places"
    | "wordle"
    | "roleta"
    | "app-pulse"
    | "plans"
    | "games";
  chips?: string[];
  question?: { q: string; options: string[] };
  /** Camada de fundo animada deste slide. */
  ambience?: Ambience;
  /** Data usada pelos slides de céu (mapa estelar, lua) e pelo contador. */
  date?: string;
  /** Quanto tempo o slide fica no ar (ms). Slides interativos duram mais. */
  ms?: number;
};
