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

export function SecaoConta({ me }: { me: Me }) {
  const [busy, setBusy] = useState(false);

  async function del() {
    const ok = await confirmDialog({
      title: "Apagar sua conta?",
      message: me.partner
        ? "Isso apaga TODAS as suas memórias, comentários e conversas, e desvincula você de " +
          (me.partner.displayName || me.partner.name) +
          ". Não dá pra desfazer."
        : "Isso apaga TODAS as suas memórias, comentários e conversas. Não dá pra desfazer.",
      confirmLabel: "Apagar tudo",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api("/api/account", { method: "DELETE" });
      window.location.assign("/");
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }

  return (
    <BlocoConfiguracao icon={ShieldAlert} title="Zona de risco">
      <p className="text-sm text-muted">
        Apagar a conta remove tudo o que é seu e desfaz o vínculo com seu parceiro(a). Essa ação é permanente.
      </p>
      <button
        onClick={del}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/8 py-2.5 font-semibold text-danger transition hover:bg-danger/15 disabled:opacity-70"
      >
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />} Apagar minha conta
      </button>
    </BlocoConfiguracao>
  );
}
