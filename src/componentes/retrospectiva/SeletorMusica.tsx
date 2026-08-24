"use client";

import { IconClose, IconMusic, IconSearch, IconSpinner } from "../IconesRetrospectiva";
import type { MusicaRetrospectivaSalva, ResultadoBuscaMusica } from "./tipos";

type PropriedadesSeletorMusica = {
  aberto: boolean;
  editandoCena: boolean;
  chaveCena: string;
  musicaCena?: MusicaRetrospectivaSalva;
  sugestaoIa?: { name: string; artist: string } | null;
  consulta: string;
  resultados: ResultadoBuscaMusica[];
  buscando: boolean;
  erro: string;
  musicaPadraoId: string | null;
  aoAlterarEdicao: (valor: boolean) => void;
  aoAlterarConsulta: (valor: string) => void;
  aoRemoverMusicaCena: () => void;
  aoSalvarMusicaCena: (faixa: ResultadoBuscaMusica) => void;
  aoSelecionarFaixa: (faixa: ResultadoBuscaMusica) => void;
  aoFechar: () => void;
  aoRemoverMusicaPadrao: () => void;
};

export function SeletorMusica({
  aberto,
  editandoCena,
  chaveCena,
  musicaCena,
  sugestaoIa,
  consulta,
  resultados,
  buscando,
  erro,
  musicaPadraoId,
  aoAlterarEdicao,
  aoAlterarConsulta,
  aoRemoverMusicaCena,
  aoSalvarMusicaCena,
  aoSelecionarFaixa,
  aoFechar,
  aoRemoverMusicaPadrao,
}: PropriedadesSeletorMusica) {
  if (!aberto) return null;

  return (
    <div
      data-retro-interactive
      role="dialog"
      aria-modal="true"
      aria-labelledby="retro-music-title"
      className="absolute inset-x-0 bottom-0 z-50 flex max-h-[65vh] flex-col bg-black/70 p-4 pb-[max(2rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
    >
      <div className="mx-auto w-full max-w-md">
        <h2 id="retro-music-title" className="sr-only">Escolher música para a retrospectiva</h2>
        <div className="mb-2 flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-white/60">
            <input
              type="checkbox"
              checked={editandoCena}
              onChange={(evento) => aoAlterarEdicao(evento.target.checked)}
              className="accent-green-500"
            />
            Música para este slide
          </label>
          {editandoCena && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{chaveCena}</span>
          )}
        </div>

        {musicaCena && editandoCena && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/10 p-2">
            {musicaCena.image && <img src={musicaCena.image} alt="" className="h-8 w-8 rounded object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white">{musicaCena.trackName}</p>
              <p className="truncate text-[10px] text-white/50">{musicaCena.artist}</p>
            </div>
            <button
              aria-label={`Remover ${musicaCena.trackName} deste slide`}
              onClick={aoRemoverMusicaCena}
              className="shrink-0 rounded-full p-1 text-red-300 transition hover:bg-white/10"
            >
              <IconClose size={13} />
            </button>
          </div>
        )}

        {sugestaoIa && !consulta && !resultados.length && (
          <div className="mb-3 rounded-xl bg-white/10 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">Sugestão da IA</p>
            <p className="text-sm text-white">{sugestaoIa.name}</p>
            <p className="text-xs text-white/60">{sugestaoIa.artist}</p>
            <button
              onClick={() => aoAlterarConsulta(`${sugestaoIa.name} ${sugestaoIa.artist}`)}
              className="mt-2 rounded-full bg-green-500/30 px-3 py-1 text-xs text-green-200 transition hover:bg-green-500/50"
            >
              Buscar esta música
            </button>
          </div>
        )}

        <div className="relative">
          <IconSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            autoFocus
            type="text"
            aria-label="Buscar música"
            value={consulta}
            onChange={(evento) => aoAlterarConsulta(evento.target.value)}
            placeholder="Digite o nome da música…"
            className="w-full rounded-full bg-white/15 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none backdrop-blur"
          />
        </div>

        {buscando && (
          <div className="mt-3 flex justify-center">
            <IconSpinner size={19} className="animate-spin text-white/60" />
          </div>
        )}

        {!buscando && resultados.length > 0 && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-black/30">
            {resultados.map((faixa) => (
              <button
                key={faixa.id}
                onClick={() => editandoCena ? aoSalvarMusicaCena(faixa) : aoSelecionarFaixa(faixa)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/10"
              >
                {faixa.image ? (
                  <img src={faixa.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/10">
                    <IconMusic size={17} className="text-white/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{faixa.name}</p>
                  <p className="truncate text-xs text-white/60">{faixa.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!buscando && consulta && !erro && resultados.length === 0 && (
          <p className="mt-3 text-center text-xs text-white/50">Nenhuma música encontrada.</p>
        )}

        {erro && <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-center text-xs text-red-200">{erro}</p>}

        <div className="mt-3 flex gap-2">
          <button onClick={aoFechar} className="flex-1 rounded-full bg-white/10 py-2 text-sm text-white/70 transition hover:bg-white/20">
            Fechar
          </button>
          {musicaPadraoId && (
            <button
              onClick={aoRemoverMusicaPadrao}
              className="flex-1 rounded-full bg-white/10 py-2 text-sm text-red-300 transition hover:bg-white/20"
            >
              Remover música
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
