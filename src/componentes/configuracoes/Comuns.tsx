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




export function BlocoConfiguracao({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Icon size={18} />
        </span>
        <h2 className="font-display text-2xl text-text">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export function paraDataDeFormulario(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text placeholder:text-faint"
      />
    </label>
  );
}

export function BotaoSalvar({ onClick, busy, label = "Salvar" }: { onClick: () => void; busy: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
    >
      {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} {label}
    </button>
  );
}
