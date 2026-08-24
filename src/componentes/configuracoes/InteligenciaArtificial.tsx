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

export function SecaoInteligenciaArtificial() {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [model, setModel] = useState("");
  const [masked, setMasked] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({ openai: "", deepseek: "", anthropic: "" });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ provider: AIProvider; model: string | null; keys: Record<string, string> }>("/api/ai/settings")
      .then((s) => {
        setProvider(s.provider);
        setModel(s.model || "");
        setMasked(s.keys);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setBusy(true);
    const keys: Record<string, string> = {};
    for (const p of ["openai", "deepseek", "anthropic"]) {
      if (values[p] && values[p].trim()) keys[p] = values[p].trim();
    }
    try {
      await api("/api/ai/settings", {
        method: "PATCH",
        body: JSON.stringify({ provider, model: model || null, keys }),
      });
      // atualiza máscaras localmente
      const nm = { ...masked };
      for (const p of Object.keys(keys)) {
        const v = keys[p];
        nm[p] = v.length <= 8 ? "••••" : `${v.slice(0, 3)}••••${v.slice(-4)}`;
      }
      setMasked(nm);
      setValues({ openai: "", deepseek: "", anthropic: "" });
      toast("Configurações de IA salvas.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const info = PROVIDERS[provider];

  return (
    <BlocoConfiguracao icon={Sparkles} title="Inteligência artificial">
      <p className="text-sm text-muted">
        Escolha o provedor e cole sua chave. Ela fica <b>criptografada</b> e é usada só nas suas conversas com os personagens.
      </p>

      <span className="mb-2 mt-4 block text-sm font-medium text-muted">Provedor</span>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(PROVIDERS) as AIProvider[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setProvider(p);
              setModel("");
            }}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-sm font-medium transition",
              provider === p ? "border-accent bg-accent/8 text-accent" : "border-border text-muted hover:bg-surface2"
            )}
          >
            {PROVIDERS[p].label.split(" ")[0]}
          </button>
        ))}
      </div>

      <span className="mb-1.5 mt-4 block text-sm font-medium text-muted">Modelo</span>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text"
      >
        <option value="">Padrão ({info.defaultModel})</option>
        {info.models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-3">
        <CampoChave
          label={PROVIDERS.openai.label}
          hint={PROVIDERS.openai.keyHint}
          url={PROVIDERS.openai.keyUrl}
          masked={masked.openai}
          value={values.openai}
          onChange={(v) => setValues((s) => ({ ...s, openai: v }))}
          loaded={loaded}
        />
        <CampoChave
          label={PROVIDERS.deepseek.label}
          hint={PROVIDERS.deepseek.keyHint}
          url={PROVIDERS.deepseek.keyUrl}
          masked={masked.deepseek}
          value={values.deepseek}
          onChange={(v) => setValues((s) => ({ ...s, deepseek: v }))}
          loaded={loaded}
        />
        <CampoChave
          label={PROVIDERS.anthropic.label}
          hint={PROVIDERS.anthropic.keyHint}
          url={PROVIDERS.anthropic.keyUrl}
          masked={masked.anthropic}
          value={values.anthropic}
          onChange={(v) => setValues((s) => ({ ...s, anthropic: v }))}
          loaded={loaded}
        />
      </div>

      <BotaoSalvar onClick={save} busy={busy} label="Salvar IA" />
    </BlocoConfiguracao>
  );
}

function CampoChave({
  label,
  hint,
  url,
  masked,
  value,
  onChange,
  loaded,
}: {
  label: string;
  hint: string;
  url: string;
  masked?: string;
  value: string;
  onChange: (v: string) => void;
  loaded: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <KeyRound size={14} /> {label}
          {masked && <span className="rounded bg-success/15 px-1.5 py-0.5 text-[11px] text-success">salva</span>}
        </span>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
          obter chave <ExternalLink size={11} />
        </a>
      </span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={loaded && masked ? `${masked} · digite para trocar` : hint}
        className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 font-mono text-sm text-text placeholder:text-faint"
      />
    </label>
  );
}
