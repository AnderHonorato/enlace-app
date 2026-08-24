"use client";

import {
  ACCENT_KEYS,
  DARK_KEYS,
  DEFAULT_ACCENT,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  LIGHT_KEYS,
} from "./temas";

export type ThemeMode = "auto" | "light" | "dark";

/** Instalações antigas podem usar temas chamados 'aurora', 'claro', 'violet'…
 *  Nenhum desses nomes tem [data-theme] em globals.css agora, e um tema
 *  inexistente cai silenciosamente no :root — o papel claro — fazendo o modo
 *  escuro parecer quebrado. Toda leitura de preferência passa por aqui. */
function pick(value: string | null | undefined, allowed: readonly string[], fallback: string) {
  return value && allowed.includes(value) ? value : fallback;
}

export function resolveTheme(mode: string, light: string, dark: string): string {
  const lightP = pick(light, LIGHT_KEYS, DEFAULT_LIGHT);
  const darkP = pick(dark, DARK_KEYS, DEFAULT_DARK);
  if (mode === "light") return lightP;
  if (mode === "dark") return darkP;
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? darkP : lightP;
}

function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

/** Aplica preferências. Valores omitidos vêm do localStorage. */
export function applyPrefs(mode?: string, light?: string, dark?: string, accent?: string) {
  if (typeof document === "undefined") return;
  const raw = mode ?? read("enlace-mode", "auto");
  const m = (["auto", "light", "dark"] as const).includes(raw as ThemeMode) ? raw : "auto";
  const l = pick(light ?? read("enlace-light", DEFAULT_LIGHT), LIGHT_KEYS, DEFAULT_LIGHT);
  const d = pick(dark ?? read("enlace-dark", DEFAULT_DARK), DARK_KEYS, DEFAULT_DARK);
  const a = pick(accent ?? read("enlace-accent", DEFAULT_ACCENT), ACCENT_KEYS, DEFAULT_ACCENT);
  try {
    localStorage.setItem("enlace-mode", m);
    localStorage.setItem("enlace-light", l);
    localStorage.setItem("enlace-dark", d);
    localStorage.setItem("enlace-accent", a);
  } catch {}
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveTheme(m, l, d));
  root.setAttribute("data-accent", a);
}

/** Reaplica quando o sistema muda (só importa no modo auto). */
export function watchSystemTheme(): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (read("enlace-mode", "auto") === "auto") applyPrefs();
  };
  mq.addEventListener?.("change", handler);
  return () => mq.removeEventListener?.("change", handler);
}
