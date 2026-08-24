"use client";

import { Loader2, LocateFixed, MapPin, Tag, X } from "lucide-react";
import { MOODS } from "@/nucleo/humores";
import { cn } from "@/nucleo/utilitarios";

const ETIQUETAS_SUGERIDAS = ["viagem", "encontro", "conquista", "festa", "família", "surpresa"];

type PropriedadesDetalhesMemoria = {
  humor: string | null;
  etiquetas: string[];
  entradaEtiqueta: string;
  lugar: string;
  coordenadas: { lat: number; lng: number } | null;
  localizando: boolean;
  aoAlterarHumor: (humor: string | null) => void;
  aoAlterarEtiquetas: (etiquetas: string[]) => void;
  aoAdicionarEtiqueta: (etiqueta: string) => void;
  aoAlterarEntradaEtiqueta: (evento: React.ChangeEvent<HTMLInputElement>) => void;
  aoTeclarEntradaEtiqueta: (evento: React.KeyboardEvent<HTMLInputElement>) => void;
  aoSairEntradaEtiqueta: () => void;
  aoAlterarLugar: (lugar: string) => void;
  aoUsarLocalizacao: () => void;
  aoRemoverLocalizacao: () => void;
};

export function DetalhesMemoria({
  humor,
  etiquetas,
  entradaEtiqueta,
  lugar,
  coordenadas,
  localizando,
  aoAlterarHumor,
  aoAlterarEtiquetas,
  aoAdicionarEtiqueta,
  aoAlterarEntradaEtiqueta,
  aoTeclarEntradaEtiqueta,
  aoSairEntradaEtiqueta,
  aoAlterarLugar,
  aoUsarLocalizacao,
  aoRemoverLocalizacao,
}: PropriedadesDetalhesMemoria) {
  return (
    <>
      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium text-faint">Como você se sente?</span>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((opcao) => {
            const selecionada = humor === opcao.key;
            return (
              <button
                key={opcao.key}
                onClick={() => aoAlterarHumor(selecionada ? null : opcao.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition",
                  selecionada ? "border-transparent text-white" : "border-border text-muted hover:bg-surface2"
                )}
                style={selecionada ? { background: opcao.color } : undefined}
              >
                <span className="text-sm">{opcao.emoji}</span> {opcao.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-faint"><Tag size={12} /> Tags</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {etiquetas.map((etiqueta) => (
            <span key={etiqueta} className="inline-flex items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent">
              #{etiqueta}
              <button onClick={() => aoAlterarEtiquetas(etiquetas.filter((atual) => atual !== etiqueta))} className="hover:text-danger">
                <X size={11} />
              </button>
            </span>
          ))}
          {ETIQUETAS_SUGERIDAS.filter((etiqueta) => !etiquetas.includes(etiqueta)).slice(0, 5).map((etiqueta) => (
            <button
              key={etiqueta}
              onClick={() => aoAdicionarEtiqueta(etiqueta)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-faint transition hover:border-accent hover:text-accent"
            >
              +{etiqueta}
            </button>
          ))}
          <input
            value={entradaEtiqueta}
            onChange={aoAlterarEntradaEtiqueta}
            onKeyDown={aoTeclarEntradaEtiqueta}
            onBlur={aoSairEntradaEtiqueta}
            placeholder="nova tag…"
            className="w-24 bg-transparent text-xs text-text placeholder:text-faint focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-faint"><MapPin size={12} /> Onde foi?</span>
        <div className="flex items-center gap-2">
          <input
            value={lugar}
            onChange={(evento) => aoAlterarLugar(evento.target.value)}
            placeholder="Ex: Café da esquina, Praia do Rosa…"
            className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3 py-2 text-sm text-text placeholder:text-faint"
          />
          <button
            type="button"
            onClick={aoUsarLocalizacao}
            disabled={localizando}
            title="Usar minha localização"
            className={cn(
              "rounded-xl border p-2 transition",
              coordenadas ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:bg-surface2"
            )}
          >
            {localizando ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
          </button>
          {coordenadas && (
            <button type="button" onClick={aoRemoverLocalizacao} className="text-faint hover:text-danger" title="Remover localização">
              <X size={15} />
            </button>
          )}
        </div>
        {coordenadas && (
          <p className="mt-1 text-[11px] text-faint">
            Vai aparecer no mapa das memórias ({coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)})
          </p>
        )}
      </div>
    </>
  );
}
