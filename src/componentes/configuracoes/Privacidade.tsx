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

export function SecaoPrivacidade() {
  const [pinOn, setPinOn] = useState(false);
  const [pin, setPin] = useState("");
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api<{ enabled: boolean }>("/api/security/pin")
      .then((r) => setPinOn(r.enabled))
      .catch(() => {});
  }, []);

  async function savePin() {
    if (!/^\d{4,8}$/.test(pin)) return toast("O PIN deve ter de 4 a 8 números.", "error");
    setBusy("pin");
    try {
      await api("/api/security/pin", { method: "POST", body: JSON.stringify({ pin }) });
      setPinOn(true);
      setPin("");
      toast("PIN ativado 🔒", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy("");
    }
  }

  async function removePin() {
    const senha = await confirmDialog({
      title: "Remover PIN",
      message: "Digite a senha da sua conta para remover o PIN de acesso.",
      confirmLabel: "Remover",
      danger: true,
      input: true,
      inputPlaceholder: "Senha da conta",
      inputType: "password",
    });
    if (!senha) return;
    setBusy("pin");
    try {
      await api("/api/security/pin", { method: "DELETE", body: JSON.stringify({ password: senha }) });
      setPinOn(false);
      try {
        sessionStorage.removeItem("enlace-desbloqueado");
      } catch {}
      toast("PIN removido.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy("");
    }
  }

  async function changePassword() {
    setBusy("pwd");
    try {
      await api("/api/security/password", {
        method: "POST",
        body: JSON.stringify({ current: pwd.current, next: pwd.next }),
      });
      setPwd({ current: "", next: "" });
      toast("Senha alterada 🔐", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <BlocoConfiguracao icon={ShieldCheck} title="Privacidade e segurança">
      {/* PIN */}
      <div className="rounded-xl border border-border2 bg-surface2 p-3.5">
        <div className="flex items-center gap-2.5">
          <LockKeyhole size={17} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-text">PIN para abrir o app</div>
            <div className="text-sm text-muted">
              {pinOn ? "Ativo — pedimos o PIN toda vez que você abre." : "Uma trava a mais no seu diário."}
            </div>
          </div>
        </div>
        {pinOn ? (
          <button
            onClick={removePin}
            disabled={busy === "pin"}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-muted transition hover:bg-surface2 disabled:opacity-70"
          >
            {busy === "pin" ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />} Remover PIN
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="4 a 8 números"
              className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm tracking-[0.3em] text-text placeholder:tracking-normal placeholder:text-faint"
            />
            <button
              onClick={savePin}
              disabled={busy === "pin" || pin.length < 4}
              className="rounded-xl accent-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "pin" ? <Loader2 size={15} className="animate-spin" /> : "Ativar"}
            </button>
          </div>
        )}
      </div>

      {/* Trocar senha */}
      <div className="mt-3 rounded-xl border border-border2 bg-surface2 p-3.5">
        <div className="mb-3 flex items-center gap-2.5">
          <KeyRound size={17} className="shrink-0 text-accent" />
          <div className="text-sm font-semibold text-text">Trocar senha</div>
        </div>
        <div className="space-y-2">
          <input
            type="password"
            value={pwd.current}
            onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
            placeholder="Senha atual"
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
          <input
            type="password"
            value={pwd.next}
            onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
            placeholder="Nova senha (mín. 6)"
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
          />
        </div>
        <button
          onClick={changePassword}
          disabled={busy === "pwd" || !pwd.current || pwd.next.length < 6}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          {busy === "pwd" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar nova senha
        </button>
      </div>

      {/* Exportar dados */}
      <a
        href="/api/account/export"
        className="mt-3 flex items-center gap-2.5 rounded-xl border border-border2 bg-surface2 p-3.5 transition hover:bg-surface2/70"
      >
        <Download size={17} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text">Baixar meus dados</div>
          <div className="text-sm text-muted">Um arquivo com tudo: memórias, fotos, conversas e planos.</div>
        </div>
      </a>
    </BlocoConfiguracao>
  );
}
