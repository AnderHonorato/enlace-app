"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin as MapPinIcon, PenLine, Search, Loader2, Plus, X, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { moodOf } from "@/nucleo/humores";
import { fmtDate } from "@/nucleo/utilitarios";
import { toast } from "./Avisos";
import { motion, AnimatePresence } from "framer-motion";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  place: string | null;
  mood: string | null;
  author: string;
  date: string;
  content: string;
  photoUrl: string | null;
};

type ManualPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  place: string | null;
  date: string;
};

const STORAGE_KEY = "enlace-map-manual";

function loadManualPins(): ManualPin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveManualPins(pins: ManualPin[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

function memoryPopup(p: MapPin) { return `<div style="font-family:inherit;min-width:230px;max-width:280px">${p.photoUrl ? `<img src="${escapeAttr(p.photoUrl)}" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:8px" />` : ""}<div style="font-weight:800;font-size:15px">${escapeHtml(p.title)}</div>${p.content ? `<div style="white-space:pre-wrap;line-height:1.45;margin-top:6px;max-height:220px;overflow:auto">${escapeHtml(p.content)}</div>` : ""}${p.place ? `<div style="opacity:.78;display:flex;align-items:center;gap:4px;margin-top:8px">${SVG_LUGAR(12, "currentColor")}${escapeHtml(p.place)}</div>` : ""}<div style="opacity:.6;font-size:11px;margin-top:6px">${escapeHtml(p.author)} · ${fmtDate(p.date)}</div></div>`; }

function manualPopup(p: ManualPin) { return `<div style="font-family:inherit;min-width:150px"><div style="font-weight:700">${escapeHtml(p.title)}</div>${p.place ? `<div style="opacity:.75;display:flex;align-items:center;gap:4px">${SVG_LUGAR(12, "currentColor")}${escapeHtml(p.place)}</div>` : ""}<div style="opacity:.6;font-size:11px;margin-top:2px">${fmtDate(p.date)}</div></div>`; }

function createMemoryIcon(L: any, p: MapPin, mood: ReturnType<typeof moodOf>) { const center = p.photoUrl ? `<img src="${escapeAttr(p.photoUrl)}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;transform:rotate(45deg)" />` : `<span style="transform:rotate(45deg);font-size:15px;line-height:1">${mood?.emoji ?? SVG_CORACAO(15, "#fff")}</span>`; return L.divIcon({ className: "", html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 4px;background:linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)));transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.95);overflow:hidden">${center}</div>`, iconSize: [36,36], iconAnchor: [18,34], popupAnchor: [0,-32] }); }

function createManualIcon(L: any) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 4px;
      background:rgb(var(--accent-2));
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.9);">
      <span style="transform:rotate(45deg);line-height:0">${SVG_CORACAO(15, "#fff")}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

export function MemoryMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const manualMarkersRef = useRef<Map<string, any>>(new Map());

  const [manualPins, setManualPins] = useState<ManualPin[]>([]);
  useEffect(() => { setManualPins(loadManualPins()); }, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cep: "",
    street: "",
    number: "",
    city: "",
    state: "",
    lat: "",
    lng: "",
    title: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showManualLatLng, setShowManualLatLng] = useState(false);

  const totalPins = pins.length + manualPins.length;
  const hasAnyPins = totalPins > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current || mapRef.current || !hasAnyPins) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const p of pins) {
        const mood = moodOf(p.mood);
        const icon = createMemoryIcon(L, p, mood);
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.bindPopup(memoryPopup(p));
        bounds.extend([p.lat, p.lng]);
      }

      for (const p of manualPins) {
        const icon = createManualIcon(L);
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.bindPopup(manualPopup(p));
        manualMarkersRef.current.set(p.id, marker);
        bounds.extend([p.lat, p.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyPins]);

  function addMarkerToMap(p: ManualPin) {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const icon = createManualIcon(L);
    const marker = L.marker([p.lat, p.lng], { icon }).addTo(mapRef.current);
    marker.bindPopup(
      `<div style="font-family:inherit;min-width:150px">
        <div style="font-weight:700">${escapeHtml(p.title)}</div>
        ${
          p.place
            ? `<div style="opacity:.75;display:flex;align-items:center;gap:4px">${SVG_LUGAR(12, "currentColor")}${escapeHtml(p.place)}</div>`
            : ""
        }
        <div style="opacity:.6;font-size:11px;margin-top:2px">${fmtDate(p.date)}</div>
      </div>`
    );
    manualMarkersRef.current.set(p.id, marker);
  }

  async function lookupCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      toast("CEP inválido. Digite 8 dígitos.", "error");
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast("CEP não encontrado.", "error");
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      }));
    } catch {
      toast("Erro ao buscar CEP.", "error");
    } finally {
      setCepLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.title.trim()) {
      toast("Dê um nome para o local.", "error");
      return;
    }

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      addPin(lat, lng);
      return;
    }

    const addressParts = [form.street, form.number, form.city, form.state, "Brasil"]
      .filter(Boolean)
      .join(", ");

    const parts = addressParts.split(", ").filter(Boolean);
    if (parts.length < 2) {
      toast("Preencha o endereço ou informe latitude/longitude.", "error");
      return;
    }

    setGeoLoading(true);
    try {
      const encoded = encodeURIComponent(addressParts);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`
      );
      const data = await res.json();
      if (!data.length) {
        toast("Local não encontrado. Tente usar latitude/longitude manual.", "error");
        return;
      }
      addPin(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch {
      toast("Erro ao buscar coordenadas.", "error");
    } finally {
      setGeoLoading(false);
    }
  }

  function addPin(lat: number, lng: number) {
    const place =
      [form.street, form.number, form.city, form.state]
        .filter(Boolean)
        .join(", ") || null;

    const newPin: ManualPin = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lat,
      lng,
      title: form.title.trim(),
      place,
      date: new Date().toISOString(),
    };

    const updated = [...manualPins, newPin];
    setManualPins(updated);
    saveManualPins(updated);
    addMarkerToMap(newPin);

    setForm({ cep: "", street: "", number: "", city: "", state: "", lat: "", lng: "", title: "" });
    setShowForm(false);
    setShowManualLatLng(false);
    toast("Local adicionado ao mapa!", "success");
  }

  function removePin(id: string) {
    const updated = manualPins.filter((p) => p.id !== id);
    setManualPins(updated);
    saveManualPins(updated);

    const marker = manualMarkersRef.current.get(id);
    if (marker) {
      marker.remove();
      manualMarkersRef.current.delete(id);
    }
  }

  function updateField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="kicker mb-1">Onde vocês estiveram</div>
          <h1 className="font-display text-3xl text-text">Mapa das memórias</h1>
          <p className="text-sm text-muted">
            {totalPins} {totalPins === 1 ? "lugar marcado" : "lugares marcados"} na história de vocês
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow"
        >
          <Plus size={16} />
          Local manual
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="card mb-4 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg text-text">Adicionar local manualmente</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface2 hover:text-text"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CEP (ex: 01001-000)"
                    value={form.cep}
                    onChange={(e) => updateField("cep", e.target.value)}
                    maxLength={9}
                    className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                  />
                  <button
                    onClick={lookupCep}
                    disabled={cepLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text transition hover:bg-surface2 disabled:opacity-50"
                  >
                    {cepLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Buscar
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Rua / Logradouro"
                  value={form.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Número"
                    value={form.number}
                    onChange={(e) => updateField("number", e.target.value)}
                    className="focus-ring w-24 shrink-0 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                  />
                  <input
                    type="text"
                    placeholder="Estado (UF)"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    maxLength={2}
                    className="focus-ring w-24 shrink-0 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualLatLng((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-text"
                >
                  <LocateFixed size={14} />
                  {showManualLatLng ? "Ocultar coordenadas manuais" : "Ou informar latitude/longitude manualmente"}
                </button>

                <AnimatePresence>
                  {showManualLatLng && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Latitude (ex: -23.5505)"
                          value={form.lat}
                          onChange={(e) => updateField("lat", e.target.value)}
                          className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                        />
                        <input
                          type="text"
                          placeholder="Longitude (ex: -46.6333)"
                          value={form.lng}
                          onChange={(e) => updateField("lng", e.target.value)}
                          className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="text"
                  placeholder="Nome do local (ex: Nosso restaurante favorito)"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-bg2 px-3.5 py-2.5 text-sm text-text placeholder:text-faint"
                />

                <button
                  onClick={handleAdd}
                  disabled={geoLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                >
                  {geoLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MapPinIcon size={16} />
                  )}
                  {geoLoading ? "Buscando coordenadas..." : "Adicionar ao mapa"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {manualPins.length > 0 && (
        <div className="mb-4 space-y-2">
          {manualPins.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface2 px-4 py-2.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ background: "rgb(var(--accent-2))" }}
              >
                📍
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text">{p.title}</div>
                {p.place && <div className="truncate text-xs text-muted">{p.place}</div>}
              </div>
              <button
                onClick={() => removePin(p.id)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface2 hover:text-danger"
                title="Remover local"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasAnyPins ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <MapPinIcon size={26} />
          </div>
          <h2 className="font-display text-2xl text-text">Nenhum lugar ainda</h2>
          <p className="mt-1 max-w-xs text-muted">
            Ao escrever uma memória, toque em <b>“usar minha localização”</b> — o lugar aparece aqui no mapa de vocês.
          </p>
          <Link href="/app/novo" className="mt-5 inline-flex items-center gap-2 rounded-full accent-gradient px-5 py-2.5 font-semibold text-white shadow-glow">
            <PenLine size={16} /> Escrever memória
          </Link>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-[65dvh] w-full overflow-hidden rounded-3xl border border-border shadow-card"
        />
      )}
    </div>
  );
}

/*
 * O Leaflet monta os marcadores e os balões a partir de HTML em texto, então
 * aqui os ícones do app entram como SVG inline em vez de componente React.
 * São os mesmos desenhos de Icones.tsx — traço arredondado, 24x24.
 */
const SVG_CORACAO = (tam: number, cor: string) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="${cor}" aria-hidden="true"><path d="M12 20.5 4.6 13.4a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 0 1 6.6 6.7Z"/></svg>`;

const SVG_LUGAR = (tam: number, cor: string) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M12 21c4.2-4.6 6.3-7.7 6.3-10.6A6.3 6.3 0 0 0 5.7 10.4C5.7 13.3 7.8 16.4 12 21Z"/></svg>`;

function escapeAttr(s: string) { return escapeHtml(s).replace(/\x27/g, "&#39;"); }
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
