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

export function SecaoRelacionamento({ me }: { me: Me }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createCouple() {
    setBusy(true);
    try {
      await api("/api/couple", { method: "POST" });
      toast("Convite criado! Compartilhe o código.", "success");
      location.reload();
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }
  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await api("/api/couple/join", { method: "POST", body: JSON.stringify({ code }) });
      toast("Conectados! 💜", "success");
      location.reload();
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }
  async function leave() {
    const ok = await confirmDialog({
      title: "Desconectar do casal?",
      message: "Suas memórias continuam com você. Vocês deixam de ver as memórias um do outro.",
      confirmLabel: "Desconectar",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api("/api/couple/leave", { method: "POST" });
      toast("Você se desconectou.", "success");
      location.reload();
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }
  function copyCode() {
    if (!me.couple) return;
    navigator.clipboard?.writeText(me.couple.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <BlocoConfiguracao icon={Heart} title="Nosso relacionamento">
      {!me.couple && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Crie um convite e envie o código para seu amor — ou entre com o código que te enviaram.
          </p>
          <button
            onClick={createCouple}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-3 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Link2 size={17} />} Criar convite
          </button>
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código do convite"
              className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 font-mono tracking-wider text-text placeholder:text-faint"
            />
            <button onClick={join} disabled={busy} className="rounded-xl border border-border bg-surface2 px-4 font-medium text-text transition hover:bg-surface2/70 disabled:opacity-70">
              Entrar
            </button>
          </div>
        </div>
      )}

      {me.couple && !me.partner && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Envie este código para seu amor entrar:</p>
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/8 p-4">
            <span className="font-mono text-2xl tracking-[0.3em] text-text">{me.couple.inviteCode}</span>
            <button onClick={copyCode} className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/25">
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <button onClick={leave} disabled={busy} className="flex items-center gap-1.5 text-sm text-faint transition hover:text-danger">
            <Unlink size={14} /> Cancelar convite
          </button>
        </div>
      )}

      {me.couple && me.partner && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border2 bg-surface2 p-3">
            <span className="flex -space-x-3">
              <Avatar name={me.name} color={me.avatarColor} url={me.avatarUrl} size={44} />
              <Avatar name={me.partner.name} color={me.partner.avatarColor} url={me.partner.avatarUrl} size={44} className="ring-2 ring-surface" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-semibold text-text">
                <Heart size={14} className="text-accent" /> {me.couple.name || `${me.name} & ${me.partner.name}`}
              </div>
              <div className="text-sm text-muted">Conectado com {me.partner.displayName || me.partner.name}</div>
            </div>
          </div>

          <HistoriaDoCasal me={me} />
          <CompartilharMemoriasPrivadas />

          <button onClick={leave} disabled={busy} className="flex items-center gap-1.5 text-sm text-faint transition hover:text-danger">
            <Unlink size={14} /> Desconectar do casal
          </button>
        </div>
      )}
    </BlocoConfiguracao>
  );
}

/** Memórias antigas que ficaram privadas e o parceiro não enxerga. */
function CompartilharMemoriasPrivadas() {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ count: number }>("/api/entries/share-all")
      .then((r) => setCount(r.count))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  async function shareAll() {
    const ok = await confirmDialog({
      title: `Compartilhar ${count} ${count === 1 ? "memória" : "memórias"}?`,
      message:
        "Elas estão marcadas como “só eu” e seu amor não consegue ver. Depois você pode tornar qualquer uma privada de novo.",
      confirmLabel: "Compartilhar",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await api<{ shared: number }>("/api/entries/share-all", { method: "POST" });
      setCount(0);
      toast(`${r.shared} ${r.shared === 1 ? "memória compartilhada" : "memórias compartilhadas"}`, "success");
      setTimeout(() => location.reload(), 900);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/8 p-3.5">
      <div className="flex items-start gap-2.5">
        <EyeOff size={18} className="mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text">
            {count} {count === 1 ? "memória está" : "memórias estão"} só para você
          </div>
          <div className="text-sm text-muted">Seu amor não consegue ver essas memórias.</div>
        </div>
      </div>
      <button
        onClick={shareAll}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} Compartilhar com meu amor
      </button>
    </div>
  );
}

function HistoriaDoCasal({ me }: { me: Me }) {
  const [metDate, setMetDate] = useState(paraDataDeFormulario(me.couple?.metDate));
  const [anniversary, setAnniversary] = useState(paraDataDeFormulario(me.couple?.anniversary));
  const [howWeMet, setHowWeMet] = useState(me.couple?.howWeMet ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/couple", {
        method: "PATCH",
        body: JSON.stringify({
          metDate: metDate ? new Date(`${metDate}T12:00:00`).toISOString() : null,
          anniversary: anniversary ? new Date(`${anniversary}T12:00:00`).toISOString() : null,
          howWeMet: howWeMet.trim() || null,
        }),
      });
      toast("Nossa história salva 💞", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border2 bg-surface2 p-3.5">
      <div className="mb-3 text-sm font-semibold text-text">Nossa história</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Quando nos conhecemos</span>
          <input
            type="date"
            value={metDate}
            onChange={(e) => setMetDate(e.target.value)}
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Início do namoro</span>
          <input
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Como nos conhecemos</span>
        <textarea
          value={howWeMet}
          onChange={(e) => setHowWeMet(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Conta a história… onde foi, quem deu o primeiro passo, o que você pensou."
          className="focus-ring w-full resize-none rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-text placeholder:text-faint"
        />
      </label>
      <BotaoSalvar onClick={save} busy={busy} label="Salvar nossa história" />
    </div>
  );
}
