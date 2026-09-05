"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Loader2, MapPin, Route } from "lucide-react";
import { api } from "@/nucleo/cliente";
import type { ParadaTrajeto } from "@/nucleo/trajeto-localizacao";

type UsuarioHistorico = { id: string; nome: string; avatarColor: string };
type PontoHistorico = {
  id: string;
  lat: number;
  lng: number;
  precisao: number | null;
  registradoEm: string;
};
type RespostaHistorico = {
  usuario: UsuarioHistorico;
  data: string;
  pontos: PontoHistorico[];
  paradas: ParadaTrajeto[];
};

function dataLocalHoje() {
  const agora = new Date();
  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatarHorario(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatarDataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.max(1, Math.round((segundos % 3600) / 60));
  return horas ? `${horas}h ${minutos}min` : `${minutos}min`;
}

export function HistoricoLocalizacaoAdmin({
  usuarios,
  usuarioInicialId,
}: {
  usuarios: UsuarioHistorico[];
  usuarioInicialId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(dataLocalHoje);
  const [usuarioId, setUsuarioId] = useState(usuarioInicialId);
  const [historico, setHistorico] = useState<RespostaHistorico | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mapaElementoRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<any>(null);
  const usuarioAtual = useMemo(
    () => usuarios.find((usuario) => usuario.id === usuarioId) ?? usuarios[0],
    [usuarioId, usuarios],
  );

  useEffect(() => {
    if (!aberto || !usuarioId) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    api<RespostaHistorico>(
      `/api/historico-localizacao?data=${encodeURIComponent(data)}&userId=${encodeURIComponent(usuarioId)}`,
    )
      .then((resposta) => {
        if (!cancelado) setHistorico(resposta);
      })
      .catch((falha) => {
        if (!cancelado) {
          setHistorico(null);
          setErro(falha instanceof Error ? falha.message : "Não foi possível abrir o histórico.");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, data, usuarioId]);

  useEffect(() => {
    if (!aberto || !mapaElementoRef.current || !historico?.pontos.length) return;
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !mapaElementoRef.current) return;
      mapaRef.current?.remove();

      const mapa = L.map(mapaElementoRef.current, {
        zoomControl: true,
        attributionControl: false,
      });
      mapaRef.current = mapa;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapa);

      const coordenadas = historico.pontos.map((ponto) => [ponto.lat, ponto.lng] as [number, number]);
      const linha = L.polyline(coordenadas, {
        color: usuarioAtual?.avatarColor || "#E5679B",
        weight: 5,
        opacity: 0.82,
        lineJoin: "round",
      }).addTo(mapa);

      historico.pontos.forEach((ponto, indice) => {
        const marcador = L.circleMarker([ponto.lat, ponto.lng], {
          radius: indice === 0 || indice === historico.pontos.length - 1 ? 6 : 3,
          color: usuarioAtual?.avatarColor || "#E5679B",
          fillColor: "#ffffff",
          fillOpacity: 1,
          weight: 2,
        }).addTo(mapa);
        marcador.bindPopup(
          `Ponto ${indice + 1}<br><strong>${formatarDataHora(ponto.registradoEm)}</strong>${
            ponto.precisao ? `<br>Precisão aproximada: ${Math.round(ponto.precisao)} m` : ""
          }`,
        );
      });

      historico.paradas.forEach((parada) => {
        const marcador = L.circleMarker([parada.lat, parada.lng], {
          radius: 9,
          color: "#7A4D00",
          fillColor: "#F7C45C",
          fillOpacity: 0.95,
          weight: 3,
        }).addTo(mapa);
        marcador.bindPopup(
          `<strong>Parada de ${formatarDuracao(parada.duracaoSegundos)}</strong><br>` +
            `${formatarHorario(parada.inicio)} até ${formatarHorario(parada.fim)}`,
        );
      });

      mapa.fitBounds(linha.getBounds().pad(0.18), { maxZoom: 17 });
      setTimeout(() => mapa.invalidateSize(), 0);
    })();

    return () => {
      cancelado = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, [aberto, historico, usuarioAtual?.avatarColor]);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-surface2"
        aria-expanded={aberto}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Route size={21} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl text-text">Histórico de localização</span>
          <span className="block text-xs text-muted">Área exclusiva do administrador</span>
        </span>
        <ChevronDown size={19} className={`text-muted transition ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">
              Usuário
              <select
                value={usuarioId}
                onChange={(evento) => setUsuarioId(evento.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              >
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted">
              Data
              <span className="relative mt-1.5 block">
                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
                <input
                  type="date"
                  value={data}
                  max={dataLocalHoje()}
                  onChange={(evento) => setData(evento.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-3 text-sm text-text outline-none focus:border-accent"
                />
              </span>
            </label>
          </div>

          {carregando && (
            <div className="flex h-56 items-center justify-center gap-2 text-sm text-muted">
              <Loader2 size={18} className="animate-spin" /> Carregando trajeto…
            </div>
          )}
          {erro && <div className="rounded-2xl border border-danger/30 bg-danger/8 p-4 text-sm text-danger">{erro}</div>}
          {!carregando && !erro && historico && !historico.pontos.length && (
            <div className="flex h-56 flex-col items-center justify-center px-5 text-center">
              <MapPin size={28} className="mb-2 text-faint" />
              <p className="font-semibold text-text">Nenhum ponto registrado neste dia</p>
              <p className="mt-1 text-xs text-muted">O histórico é criado enquanto a localização está compartilhada.</p>
            </div>
          )}
          {!carregando && !erro && historico && historico.pontos.length > 0 && (
            <>
              <div ref={mapaElementoRef} className="h-[55dvh] min-h-[360px] w-full overflow-hidden rounded-2xl border border-border" />
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-full bg-bg2 px-3 py-1.5">{historico.pontos.length} pontos</span>
                <span className="rounded-full bg-bg2 px-3 py-1.5">{historico.paradas.length} paradas</span>
              </div>
              {historico.paradas.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-bold text-text">Tempo nos pontos</h3>
                  {historico.paradas.map((parada, indice) => (
                    <div key={`${parada.inicio}-${indice}`} className="flex items-center gap-3 rounded-2xl border border-border bg-bg2 p-3">
                      <Clock3 size={18} className="shrink-0 text-accent" />
                      <div className="min-w-0 flex-1 text-xs text-muted">
                        <div className="font-semibold text-text">Parada {indice + 1} · {formatarDuracao(parada.duracaoSegundos)}</div>
                        <div>{formatarHorario(parada.inicio)} até {formatarHorario(parada.fim)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
