"use client";
import { useEffect } from "react";
import { watchSystemTheme, applyPrefs } from "@/nucleo/tema-cliente";

export function ThemeWatcher() {
  useEffect(() => {
    applyPrefs();
    return watchSystemTheme();
  }, []);
  return null;
}
