"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Navigation, Satellite, Loader2, WifiOff, Heart } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { useLiveLocationContext } from "@/nucleo/localizacao-ao-vivo";
import { Avatar } from "./Avatar";
import { cn } from "@/nucleo/utilitarios";

type Props = {
  me: { id: string; name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null };
  partner: { id: string; name: string; displayName: string | null; avatarColor: string; avatarUrl: string | null } | null;
};

function fmtAgo(iso: string | null): string {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 10) return "agora";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}min`;
}

export function LiveCoupleMap({ me, partner: partnerInfo }: Props) {
  const { myPos, sharing, partner, error, locating, startSharing, stopSharing } = useLiveLocationContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const partnerMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const hasMap = !!(myPos || partner?.lat);

  // Inicializa o mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        zoom: 14,
      });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      setTimeout(() => map.invalidateSize(), 0);
    })();
    return () => { cancelled = true; };
  }, []);

  // Centraliza quando tem posições
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      const bounds = L.latLngBounds([]);
      if (myPos) bounds.extend([myPos.lat, myPos.lng]);
      if (partner?.lat != null && partner?.lng != null) bounds.extend([partner.lat, partner.lng]);
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.4), { maxZoom: 16 });
      } else if (myPos) {
        map.setView([myPos.lat, myPos.lng], 14);
      }
      map.invalidateSize();
    })();
    return () => { cancelled = true; };
  }, [myPos, partner?.lat, partner?.lng, hasMap]);

  // Atualiza marcadores
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (async () => {
      const L = (await import("leaflet")).default;

      // Marcador "EU"
      if (myPos && !meMarkerRef.current) {
        const icon = createMeIcon(L);
        meMarkerRef.current = L.marker([myPos.lat, myPos.lng], { icon, zIndexOffset: 100 }).addTo(map);
      } else if (myPos && meMarkerRef.current) {
        meMarkerRef.current.setLatLng([myPos.lat, myPos.lng]);
      } else if (!myPos && meMarkerRef.current) {
        map.removeLayer(meMarkerRef.current);
        meMarkerRef.current = null;
      }

      // Marcador parceiro
      if (partner?.lat && partner?.lng && !partnerMarkerRef.current) {
        const icon = createPartnerIcon(L, partner.avatarColor);
        partnerMarkerRef.current = L.marker([partner.lat, partner.lng], { icon, zIndexOffset: 90 }).addTo(map);
        partnerMarkerRef.current.bindPopup(
          `<div style="font-family:system-ui,sans-serif;min-width:140px;text-align:center">
            <div style="font-weight:700;font-size:14px">${partner.name}</div>
            <div style="opacity:.6;font-size:11px">${partner.sharing ? "Compartilhando · " + fmtAgo(partner.updatedAt) : "Não está compartilhando"}</div>
          </div>`
        );
      } else if (partner?.lat && partner?.lng && partnerMarkerRef.current) {
        partnerMarkerRef.current.setLatLng([partner.lat, partner.lng]);
        partnerMarkerRef.current.setPopupContent(
          `<div style="font-family:system-ui,sans-serif;min-width:140px;text-align:center">
            <div style="font-weight:700;font-size:14px">${partner.name}</div>
            <div style="opacity:.6;font-size:11px">${partner.sharing ? "Compartilhando · " + fmtAgo(partner.updatedAt) : "Não está compartilhando"}</div>
          </div>`
        );
      } else if ((!partner?.lat || !partner?.lng) && partnerMarkerRef.current) {
        map.removeLayer(partnerMarkerRef.current);
        partnerMarkerRef.current = null;
      }

      // Linha entre os dois
      if (myPos && partner?.lat && partner?.lng) {
        if (!lineRef.current) {
          lineRef.current = L.polyline(
            [[myPos.lat, myPos.lng], [partner.lat, partner.lng]],
            { color: "rgb(var(--accent))", weight: 2, dashArray: "8 4", opacity: 0.5 }
          ).addTo(map);
        } else {
          lineRef.current.setLatLngs([[myPos.lat, myPos.lng], [partner.lat, partner.lng]]);
        }
      } else if (lineRef.current) {
        map.removeLayer(lineRef.current);
        lineRef.current = null;
      }
    })();
  }, [myPos, partner, mapRef.current]);

  const meName = me.displayName || me.name;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl text-text">Ao vivo</h1>
          <p className="text-sm text-muted">
            {sharing && partner?.sharing ? "Vocês dois estão compartilhando localização" : sharing ? "Você está compartilhando" : "Compartilhe sua localização com seu amor"}
          </p>
        </div>
      </div>

      {/* Barra de status */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={sharing ? stopSharing : startSharing}
          disabled={locating}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60",
            sharing ? "bg-danger" : "accent-gradient"
          )}
        >
          {locating ? <Loader2 size={17} className="animate-spin" /> : sharing ? <WifiOff size={17} /> : <Navigation size={17} />}
          {sharing ? "Parar" : "Compartilhar localização"}
        </button>

        {/* Status dos parceiros */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", sharing ? "bg-success animate-pulse" : "bg-faint")} />
            <span className="text-xs text-muted">{meName}</span>
          </div>
          {partnerInfo && (
            <>
              <Heart size={12} className="text-faint" />
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", partner?.sharing ? "bg-success animate-pulse" : "bg-faint")} />
                <span className="text-xs text-muted">{partnerInfo.displayName || partnerInfo.name}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Mapa */}
      <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
        {!hasMap && !sharing && !locating ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Satellite size={30} />
            </div>
            <h2 className="font-display text-2xl text-text">Veja onde seu amor está</h2>
            <p className="mt-1 max-w-xs text-muted">
              Toque em <b>"Compartilhar localização"</b> e convide seu parceiro para fazer o mesmo. O mapa mostra os dois em tempo real.
            </p>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="h-[60dvh] w-full" />
            {/* Legenda sutil */}
            <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-border2 bg-surface px-3 py-1.5 text-[11px] text-muted shadow-soft">
              {sharing && myPos && (
                <span className="mr-3 inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Você
                </span>
              )}
              {partner?.sharing && partner.lat && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partner.avatarColor }} /> {partner.name}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Cards dos parceiros */}
      {partnerInfo && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PartnerCard
            name={meName}
            avatarColor={me.avatarColor}
            avatarUrl={me.avatarUrl}
            label="Você"
            sharing={sharing}
            lat={myPos?.lat ?? null}
            lng={myPos?.lng ?? null}
          />
          <PartnerCard
            name={partnerInfo.displayName || partnerInfo.name}
            avatarColor={partnerInfo.avatarColor}
            avatarUrl={partnerInfo.avatarUrl}
            label={partnerInfo.displayName || partnerInfo.name}
            sharing={partner?.sharing ?? false}
            lat={partner?.lat ?? null}
            lng={partner?.lng ?? null}
            updatedAt={partner?.updatedAt ?? null}
          />
        </div>
      )}
    </div>
  );
}

function PartnerCard({
  name, avatarColor, avatarUrl, label, sharing, lat, lng, updatedAt,
}: {
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  label: string;
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  updatedAt?: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
    >
      <Avatar name={name} color={avatarColor} url={avatarUrl} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-text">{label}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", sharing ? "bg-success" : "bg-faint")} />
          {sharing
            ? lat != null
              ? `Lat ${lat.toFixed(4)} · Lng ${lng?.toFixed(4)}`
              : "Aguardando sinal..."
            : "Não está compartilhando"}
          {updatedAt && sharing && (
            <span className="text-faint">· {fmtAgo(updatedAt)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function createMeIcon(L: any) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)));
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 4px rgba(var(--accent),.3),0 4px 16px rgba(0,0,0,.4);
      animation:pulse-ring 2s infinite;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L15 9H22L16 14L19 21L12 16L5 21L8 14L2 9H9Z"/>
      </svg>
    </div>
    <style>@keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(var(--accent),.5)}70%{box-shadow:0 0 0 12px rgba(var(--accent),0)}100%{box-shadow:0 0 0 0 rgba(var(--accent),0)}}</style>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function createPartnerIcon(L: any, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.9);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
