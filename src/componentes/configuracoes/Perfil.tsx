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

const CORES_AVATAR = ["#E5679B", "#9575E8", "#F4726A", "#E0A84A", "#4ABEB0", "#5AA0F0", "#F06595", "#7C6BF0"];

export function SecaoPerfil({ me }: { me: Me }) {
  const [name, setName] = useState(me.name);
  const [displayName, setDisplayName] = useState(me.displayName ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [birthday, setBirthday] = useState(paraDataDeFormulario(me.birthday));
  const [color, setColor] = useState(me.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(f?: File | null) {
    if (!f) return;
    try {
      const img = await compressImage(f, 512, 0.8);
      setAvatarUrl(img.url);
    } catch {
      toast("Não consegui processar a imagem.", "error");
    }
  }

  async function save() {
    setBusy(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim() || me.name,
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          birthday: birthday ? new Date(`${birthday}T12:00:00`).toISOString() : null,
          avatarColor: color,
          avatarUrl,
        }),
      });
      toast("Perfil salvo.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BlocoConfiguracao icon={UserIcon} title="Perfil">
      <div className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative shrink-0">
          <Avatar name={displayName || name} color={color} url={avatarUrl} size={72} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full accent-gradient text-white shadow-soft">
            <Camera size={14} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-1.5">
          {CORES_AVATAR.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setAvatarUrl(null);
              }}
              className={cn("h-7 w-7 rounded-full transition", color === c && !avatarUrl && "ring-2 ring-offset-2 ring-offset-surface")}
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <CampoTexto label="Nome" value={name} onChange={setName} />
        <CampoTexto label="Como te chamam (apelido)" value={displayName} onChange={setDisplayName} placeholder="Ex: Bibi" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Data de nascimento</span>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Uma frase sobre você…"
            className="focus-ring w-full resize-none rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text placeholder:text-faint"
          />
        </label>
      </div>

      <BotaoSalvar onClick={save} busy={busy} />
    </BlocoConfiguracao>
  );
}
