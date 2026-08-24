"use client";
import { useEffect } from "react";
import { applyPrefs } from "@/nucleo/tema-cliente";

export function ThemeSync({
  mode,
  light,
  dark,
  accent,
}: {
  mode?: string;
  light?: string;
  dark?: string;
  accent?: string;
}) {
  useEffect(() => {
    applyPrefs(mode, light, dark, accent);
  }, [mode, light, dark, accent]);
  return null;
}
