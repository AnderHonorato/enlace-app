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

export function SecaoNotificacoes() {
  const [devices, setDevices] = useState(0);
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    setDenied(permissionState() === "denied");
    api<{ available: boolean; devices: number }>("/api/push")
      .then((r) => {
        setAvailable(r.available);
        setDevices(r.devices);
      })
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const sub = await subscribeToPush(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "");
      await api("/api/push", { method: "POST", body: JSON.stringify(sub) });
      setDevices((d) => d + 1);
      toast("Notificações ligadas 🔔", "success");
    } catch (err: any) {
      if (String(err?.message).includes("negada")) setDenied(true);
      toast(err.message || "Não consegui ligar as notificações.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      await api(`/api/push${endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : ""}`, {
        method: "DELETE",
      });
      setDevices(0);
      toast("Notificações desligadas.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const supported = pushSupported();

  return (
    <BlocoConfiguracao icon={Bell} title="Notificações">
      <p className="text-sm text-muted">
        Receba um aviso quando seu amor escrever uma memória, comentar ou mandar mensagem.
      </p>

      {!available && (
        <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">
          O servidor ainda não tem as chaves de notificação configuradas.
        </p>
      )}
      {!supported && (
        <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">
          Este navegador não suporta notificações. No iPhone, instale o app na tela de início primeiro.
        </p>
      )}
      {denied && (
        <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          As notificações estão bloqueadas nas permissões do navegador. Libere e tente de novo.
        </p>
      )}

      {devices > 0 ? (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success">
            <BellRing size={16} /> Ligadas em {devices} {devices === 1 ? "aparelho" : "aparelhos"}
          </div>
          <button
            onClick={disable}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-70"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <BellOff size={16} />} Desligar neste aparelho
          </button>
        </>
      ) : (
        <button
          onClick={enable}
          disabled={busy || !available || !supported}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Bell size={17} />} Ligar notificações
        </button>
      )}
    </BlocoConfiguracao>
  );
}
