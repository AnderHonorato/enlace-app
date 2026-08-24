"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Palette,
  Heart,
  Sparkles,
  Copy,
  Check,
  Link2,
  LogOut,
  Loader2,
  Camera,
  KeyRound,
  ExternalLink,
  Unlink,
  Trash2,
  Sun,
  Moon,
  SunMoon,
  ShieldAlert,
  EyeOff,
  Users,
  Bell,
  BellRing,
  BellOff,
  ShieldCheck,
  LockKeyhole,
  Unlock,
  Download,
} from "lucide-react";
import { pushSupported, permissionState, subscribeToPush, unsubscribeFromPush } from "@/nucleo/notificacao-push-cliente";
import { Avatar } from "../Avatar";
import { BackgroundPicker } from "../FotoFundo";
import { api } from "@/nucleo/cliente";
import { toast } from "../Avisos";
import { confirmDialog } from "../DialogoConfirmacao";
import { applyPrefs } from "@/nucleo/tema-cliente";
import { compressImage } from "@/nucleo/imagem";
import {
  LIGHT_PALETTES,
  DARK_PALETTES,
  ACCENTS,
  LIGHT_KEYS,
  DARK_KEYS,
  ACCENT_KEYS,
  DEFAULT_LIGHT,
  DEFAULT_DARK,
  DEFAULT_ACCENT,
} from "@/nucleo/temas";
import { PROVIDERS, type AIProvider } from "@/nucleo/ia";
import { cn } from "@/nucleo/utilitarios";
import type { Me } from "@/nucleo/usuario-atual";


import { BlocoConfiguracao, paraDataDeFormulario, CampoTexto, BotaoSalvar } from "./Comuns";

const MODOS = [
  { key: "auto", label: "Automático", icon: SunMoon },
  { key: "light", label: "Claro", icon: Sun },
  { key: "dark", label: "Escuro", icon: Moon },
];

function GradePaletas({
  palettes,
  selected,
  onSelect,
  cols,
}: {
  palettes: readonly { key: string; label: string; swatch: readonly string[] }[];
  selected: string;
  onSelect: (k: string) => void;
  cols: string;
}) {
  return (
    <div className={cn("grid gap-2.5", cols)}>
      {palettes.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-3 transition",
            selected === t.key ? "border-accent bg-accent/8" : "border-border hover:bg-surface2"
          )}
        >
          <span className="flex h-9 w-full items-center justify-center rounded-lg border border-border/60" style={{ background: t.swatch[0] }}>
            <span className="h-4 w-4 rounded-full" style={{ background: t.swatch[1] }} />
          </span>
          <span className="text-xs font-medium text-text">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SecaoAparencia({ me }: { me: Me }) {
  // O perfil pode carregar temas da v1 ('claro', 'aurora', 'violet'), que não
  // existem mais. Sem o saneamento nenhum cartão apareceria selecionado.
  const keep = (v: string | null | undefined, allowed: readonly string[], def: string) =>
    v && allowed.includes(v) ? v : def;
  const [mode, setMode] = useState(me.themeMode || "auto");
  const [light, setLight] = useState(keep(me.themeLight, LIGHT_KEYS, DEFAULT_LIGHT));
  const [dark, setDark] = useState(keep(me.theme, DARK_KEYS, DEFAULT_DARK));
  const [accent, setAccent] = useState(keep(me.accent, ACCENT_KEYS, DEFAULT_ACCENT));

  function persist(body: object) {
    api("/api/profile", { method: "PATCH", body: JSON.stringify(body) }).catch(() => {});
  }
  function chooseMode(m: string) {
    setMode(m);
    applyPrefs(m, undefined, undefined, undefined);
    persist({ themeMode: m });
  }
  function chooseLight(p: string) {
    setLight(p);
    applyPrefs(undefined, p, undefined, undefined);
    persist({ themeLight: p });
  }
  function chooseDark(p: string) {
    setDark(p);
    applyPrefs(undefined, undefined, p, undefined);
    persist({ theme: p });
  }
  function chooseAccent(a: string) {
    setAccent(a);
    applyPrefs(undefined, undefined, undefined, a);
    persist({ accent: a });
  }

  return (
    <BlocoConfiguracao icon={Palette} title="Aparência">
      <span className="mb-2 block text-sm font-medium text-muted">Tema</span>
      <div className="grid grid-cols-3 gap-2">
        {MODOS.map((m) => (
          <button
            key={m.key}
            onClick={() => chooseMode(m.key)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-medium transition",
              mode === m.key ? "border-accent bg-accent/8 text-accent" : "border-border text-muted hover:bg-surface2"
            )}
          >
            <m.icon size={20} />
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-faint">
        {mode === "auto" ? "Segue o tema do seu aparelho." : mode === "light" ? "Sempre claro." : "Sempre escuro."}
      </p>

      {mode !== "dark" && (
        <>
          <span className="mb-2 mt-4 block text-sm font-medium text-muted">Estilo claro</span>
          <GradePaletas palettes={LIGHT_PALETTES} selected={light} onSelect={chooseLight} cols="grid-cols-2" />
        </>
      )}

      {mode !== "light" && (
        <>
          <span className="mb-2 mt-4 block text-sm font-medium text-muted">Estilo escuro</span>
          <GradePaletas palettes={DARK_PALETTES} selected={dark} onSelect={chooseDark} cols="grid-cols-2 sm:grid-cols-4" />
        </>
      )}

      <span className="mb-2 mt-4 block text-sm font-medium text-muted">Cor de acento</span>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => chooseAccent(a.key)}
            title={a.label}
            className={cn("h-9 w-9 rounded-full transition", accent === a.key && "ring-2 ring-offset-2 ring-offset-surface")}
            style={{ background: a.color, boxShadow: accent === a.key ? `0 0 0 2px ${a.color}` : undefined }}
          >
            {accent === a.key && <Check size={16} className="mx-auto text-white" />}
          </button>
        ))}
      </div>
    </BlocoConfiguracao>
  );
}
