"use client";

import { cn } from "@/nucleo/utilitarios";

export type GameArtKind = "draw" | "cards" | "words" | "truth" | "grid" | "wheel" | "quiz" | "music" | "film" | "stop" | "quest" | "trophy" | "timer";

/** Mini-ilustrações vetoriais próprias, sem glifos do sistema ou emojis. */
export function GameArt({ kind, className }: { kind: GameArtKind; className?: string }) {
  const art: Record<GameArtKind, React.ReactNode> = {
    draw: <><path d="M22 55c18-23 42-21 58-4s38 16 51-6" /><path d="m95 18 25 25-44 43-30 5 6-29 43-44Z" fill="#C0395C" /><path d="m86 27 25 25" /><circle cx="37" cy="34" r="12" fill="#B8862F" /><path d="M32 34h10M37 29v10" /></>,
    cards: <><rect x="35" y="19" width="62" height="75" rx="4" fill="#F5EAD7" transform="rotate(-9 66 56)" /><rect x="55" y="27" width="62" height="75" rx="4" fill="#C0395C" transform="rotate(8 86 64)" /><path d="m73 60 12-12 12 12-12 12-12-12Z" fill="#F5EAD7" /><path d="M25 91c20-8 36-8 50 0" /></>,
    words: <><rect x="23" y="25" width="104" height="63" rx="3" fill="#F5EAD7" /><path d="M38 43h72M38 58h50M38 73h62" /><path d="m112 74 18 18" /><circle cx="102" cy="64" r="20" fill="#B8862F" /></>,
    truth: <><path d="M75 94C31 69 28 37 47 26c13-8 24 1 28 10 5-9 16-18 29-10 19 11 16 43-29 68Z" fill="#C0395C" /><path d="M75 49c8-10 20-2 13 8-3 4-8 5-8 12M79 78h.01" /></>,
    grid: <><rect x="30" y="18" width="90" height="90" rx="3" fill="#F5EAD7" /><path d="M60 18v90M90 18v90M30 48h90M30 78h90" /><path d="m38 27 14 14M52 27 38 41M98 56c18-8 20 18 0 13-15-4-8-17 0-13Z" stroke="#C0395C" /></>,
    wheel: <><circle cx="75" cy="61" r="42" fill="#F5EAD7" /><path d="M75 61V19A42 42 0 0 1 111 82L75 61Z" fill="#C0395C" /><path d="M75 61 42 87A42 42 0 0 1 75 19v42Z" fill="#B8862F" /><circle cx="75" cy="61" r="8" fill="#17140F" /><path d="m70 9 5 10 5-10" /></>,
    quiz: <><path d="M30 30h80v55H71L52 101V85H30V30Z" fill="#F5EAD7" /><path d="M63 48c2-14 28-13 28 2 0 11-14 10-14 20M77 78h.01" /><circle cx="115" cy="33" r="13" fill="#B8862F" /></>,
    music: <><path d="M91 23v59c0 15-27 18-27 2 0-12 15-17 27-12M91 35l31-7v47c0 15-27 18-27 2 0-12 15-17 27-12" /><path d="M91 47l31-7" stroke="#C0395C" /></>,
    film: <><path d="M28 37h94v57H28z" fill="#F5EAD7" /><path d="M28 37 40 20h94l-12 17H28Z" fill="#C0395C" /><path d="m48 20-12 17M76 20 64 37M104 20 92 37M47 58h56M47 74h40" /></>,
    stop: <><path d="M40 26h70v81H40z" fill="#F5EAD7" /><path d="M54 46h42M54 62h42M54 78h29" /><path d="m96 89 28-47 9 5-28 47-15 8 6-13Z" fill="#C0395C" /></>,
    quest: <><path d="M28 97c25-55 57-75 96-64-17 7-24 23-25 38-14-6-28 3-33 17-13-4-25 0-38 9Z" fill="#B8862F" /><path d="M41 92c26-33 52-48 77-51" /><circle cx="118" cy="38" r="9" fill="#C0395C" /><path d="m49 30 10 7-10 7-10-7 10-7Z" /></>,
    trophy: <><path d="M51 22h48v31c0 20-11 31-24 31S51 73 51 53V22Z" fill="#B8862F" /><path d="M51 31H31c0 24 8 34 25 34M99 31h20c0 24-8 34-25 34M75 84v17M55 108h40" /><path d="m75 34 6 12 13 2-10 9 2 13-11-6-11 6 2-13-10-9 13-2 6-12Z" fill="#F5EAD7" /></>,
    timer: <><circle cx="75" cy="65" r="39" fill="#F5EAD7" /><path d="M59 16h32M75 26v10M109 35l9-9M75 65l19-15" /><path d="M75 65 56 80" stroke="#C0395C" /><circle cx="75" cy="65" r="5" fill="#B8862F" /></>,
  };
  return (
    <svg viewBox="0 0 150 120" className={cn("h-full w-full", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {art[kind]}
    </svg>
  );
}
