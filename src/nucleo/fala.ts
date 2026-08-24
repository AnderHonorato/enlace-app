"use client";

// Leitura em voz alta usando a Web Speech API (nativa do navegador, sem dependências).

export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => /pt[-_]BR/i.test(v.lang)) ??
    voices.find((v) => /^pt/i.test(v.lang)) ??
    null
  );
}

/** Lê um texto em voz alta. Retorna false se o navegador não suportar. */
export function speak(text: string, opts: { pitch?: number; rate?: number } = {}): boolean {
  if (!speechAvailable()) return false;
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!clean) return false;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "pt-BR";
  u.pitch = opts.pitch ?? 1;
  u.rate = opts.rate ?? 1;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

/** Cada personagem fala com um tom próprio. */
export const CHARACTER_VOICE: Record<string, { pitch: number; rate: number }> = {
  lua: { pitch: 1.15, rate: 0.92 },
  sol: { pitch: 1.25, rate: 1.08 },
  cupido: { pitch: 1.35, rate: 1.02 },
  nino: { pitch: 0.85, rate: 0.95 },
  bel: { pitch: 1.2, rate: 0.98 },
};
