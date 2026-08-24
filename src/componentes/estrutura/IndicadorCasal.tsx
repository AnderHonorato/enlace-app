"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Link2 } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { useLiveLocationContext } from "@/nucleo/localizacao-ao-vivo";
import type { Me } from "@/nucleo/usuario-atual";
import { Avatar } from "../Avatar";

function formatarDistancia(quilometros: number) {
  return quilometros < 10 ? quilometros.toFixed(1) : Math.round(quilometros).toString();
}

function formatarPresenca(estado: "online" | "away" | "offline", ultimaVez: string | null, agora: number) {
  if (estado === "online") return "online";
  if (!ultimaVez || !agora) return estado === "away" ? "ausente" : "offline";
  const minutos = Math.max(1, Math.floor((agora - new Date(ultimaVez).getTime()) / 60_000));
  return estado === "away" ? `ausente há ${minutos} min` : `offline há ${minutos} min`;
}

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radianos = Math.PI / 180;
  const diferencaLat = (lat2 - lat1) * radianos;
  const diferencaLng = (lng2 - lng1) * radianos;
  const a = Math.sin(diferencaLat / 2) ** 2
    + Math.cos(lat1 * radianos) * Math.cos(lat2 * radianos) * Math.sin(diferencaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function IndicadorCasal({ usuario }: { usuario: Me }) {
  const localizacao = useLiveLocationContext();
  const [agora, setAgora] = useState(0);

  useEffect(() => {
    setAgora(Date.now());
    const identificador = window.setInterval(() => setAgora(Date.now()), 30_000);
    return () => window.clearInterval(identificador);
  }, []);

  const parceiro = localizacao.partner;
  const distancia = localizacao.myPos && parceiro?.lat != null && parceiro.lng != null
    ? calcularDistancia(localizacao.myPos.lat, localizacao.myPos.lng, parceiro.lat, parceiro.lng)
    : null;
  const presenca = parceiro ? formatarPresenca(parceiro.status, parceiro.lastSeenAt, agora) : "offline";
  const classePresenca = parceiro?.status === "online" ? "bg-success" : parceiro?.status === "away" ? "bg-warning" : "bg-faint";

  if (usuario.couple && usuario.partner) {
    return (
      <Link href="/app/config" className="scrap-frame scrap-frame-quiet mx-3 mb-3 flex items-center gap-2.5 rounded-2xl border border-border2 bg-surface p-2.5 transition-colors hover:bg-surface2">
        <span className="flex items-center">
          <Avatar name={usuario.name} color={usuario.avatarColor} url={usuario.avatarUrl} size={28} />
          <Avatar name={usuario.partner.name} color={usuario.partner.avatarColor} url={usuario.partner.avatarUrl} size={28} className="-ml-[10px] ring-2 ring-surface" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-text">
            <Heart size={11} className="text-accent" /> Conectados
          </div>
          <div className="truncate text-[11px] text-faint">{usuario.couple.name || usuario.partner.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-faint">
            <span className={cn("h-1.5 w-1.5 rounded-full", classePresenca)} />
            <span>{presenca}</span>
            {distancia != null && <span className="truncate">· você está a {formatarDistancia(distancia)} km</span>}
          </div>
        </div>
      </Link>
    );
  }

  if (usuario.couple) {
    return (
      <Link href="/app/config" className="scrap-frame scrap-frame-quiet mx-3 mb-3 block rounded-2xl border border-accent/40 bg-accent/[0.06] p-2.5 text-xs text-accentInk transition-colors hover:bg-accent/10">
        <div className="flex items-center gap-1.5 font-semibold"><Link2 size={13} /> Convide seu amor</div>
        <div className="mt-1 font-mono text-[13px] tracking-[0.14em] text-text">{usuario.couple.inviteCode}</div>
      </Link>
    );
  }

  return (
    <Link href="/app/config" className="scrap-frame scrap-frame-quiet mx-3 mb-3 flex items-center gap-2 rounded-2xl border border-border2 bg-surface p-2.5 text-xs text-muted transition-colors hover:bg-surface2">
      <Link2 size={14} className="text-accent" /> Conectar com meu amor
    </Link>
  );
}
