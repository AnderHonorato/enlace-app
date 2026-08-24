"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { spring } from "@/nucleo/movimento";
import { cn } from "@/nucleo/utilitarios";
import {
  AchievementCard,
  AppPulseScene,
  CountUp,
  GamesScene,
  JourneyTimeline,
  LiveCounter,
  MoonView,
  PlacesMap,
  PlansScene,
  QuestionsScene,
  RevealTitle,
  StarMap,
} from "../CenasRetrospectiva";
import { IconCheck, IconFilm, IconPicture, IconReplay, IconSpinner } from "../IconesRetrospectiva";
import { RevelacaoPalavra, RevelacaoRoleta } from "./Brincadeiras";
import { Colagem, Mural, Polaroide, TiraDeFilme } from "./MoldurasFotos";
import type { CenaRetrospectiva, DadosRetrospectiva } from "./tipos";

type PropriedadesConteudoRetrospectiva = {
  cena: CenaRetrospectiva;
  dados: DadosRetrospectiva;
  direcao: number;
  coreografia: Variants;
  temMusica: boolean;
  ultimo: boolean;
  outroSemestre?: number;
  classeAcaoSecundaria: string;
  gravando: boolean;
  progressoGravacao: number;
  compartilhando: boolean;
  aoGerarVideo: () => void;
  aoCompartilhar: () => void;
  aoReiniciar: () => void;
};

export function ConteudoRetrospectiva({
  cena,
  dados,
  direcao,
  coreografia,
  temMusica,
  ultimo,
  outroSemestre,
  classeAcaoSecundaria,
  gravando,
  progressoGravacao,
  compartilhando,
  aoGerarVideo,
  aoCompartilhar,
  aoReiniciar,
}: PropriedadesConteudoRetrospectiva) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});

  return (
    <div
      className={cn(
        "retro-editorial-content flex h-full flex-col items-center overflow-y-auto overscroll-contain px-6 text-center sm:px-8",
        "pt-[calc(env(safe-area-inset-top)+4.5rem)]",
        temMusica ? "pb-36" : "pb-14"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={cena.key}
          custom={direcao}
          variants={coreografia}
          initial="enter"
          animate="center"
          exit="exit"
          className="retro-editorial-slide relative my-auto flex w-full max-w-md shrink-0 flex-col items-center"
        >
          {cena.eyebrow && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ delay: 0.15 }}
              className="retro-editorial-eyebrow mb-3 text-sm font-semibold uppercase tracking-[0.2em]"
            >
              {cena.eyebrow}
            </motion.p>
          )}

          {cena.emoji && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 14 }}
              className="retro-editorial-emoji mb-3 text-7xl"
            >
              {cena.emoji}
            </motion.div>
          )}

          {cena.layout === "collage" && cena.photos && <Colagem photos={cena.photos} />}
          {cena.layout === "mural" && cena.photos && <Mural photos={cena.photos} />}
          {cena.layout === "filmstrip" && cena.photos && <TiraDeFilme photos={cena.photos} />}
          {cena.layout === "polaroid" && cena.photo && (
            <div className="mb-4">
              <Polaroide src={cena.photo} alt={cena.title} rotate={-3} delay={0.2} size={272} kenBurns />
            </div>
          )}

          {cena.layout === "starmap" && cena.date && (
            <StarMap
              date={cena.date}
              label={new Date(cena.date).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          )}
          {cena.layout === "moon" && cena.date && <MoonView date={cena.date} />}
          {cena.layout === "counter" && cena.date && <LiveCounter from={cena.date} />}
          {cena.layout === "timeline" && dados.timeline && (
            <div className="mt-4 flex w-full justify-center">
              <JourneyTimeline items={dados.timeline.slice(0, 5)} />
            </div>
          )}
          {cena.layout === "places" && dados.placeList && (
            <div className="mt-2 flex w-full justify-center">
              <PlacesMap places={dados.placeList} />
            </div>
          )}
          {cena.layout === "achievements" && dados.achievements && (
            <div className="mt-4 w-full max-w-sm space-y-2.5">
              {dados.achievements
                .slice(Number(cena.key.split("-")[1]) * 3, Number(cena.key.split("-")[1]) * 3 + 3)
                .map((conquista, indice) => <AchievementCard key={conquista.key} a={conquista} index={indice} />)}
            </div>
          )}
          {cena.layout === "wordle" && dados.wordleWord && <RevelacaoPalavra word={dados.wordleWord} />}
          {cena.layout === "roleta" && dados.roletaOptions && <RevelacaoRoleta options={dados.roletaOptions} />}
          {cena.layout === "app-pulse" && dados.appStats && <AppPulseScene stats={dados.appStats} />}
          {cena.layout === "plans" && dados.appStats && <PlansScene stats={dados.appStats} />}
          {cena.layout === "games" && dados.appStats && <GamesScene stats={dados.appStats} />}

          {cena.big && (
            <motion.div
              initial={{ opacity: 0, scale: 0.55, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, ...spring.bouncy }}
            >
              <CountUp
                value={cena.big}
                delay={0.28}
                className="retro-editorial-big font-display text-7xl leading-none drop-shadow-lg tabular-nums sm:text-8xl"
              />
            </motion.div>
          )}

          {cena.title && (
            <RevealTitle
              text={cena.title}
              delay={0.3}
              className="retro-editorial-title mt-3 font-display text-4xl leading-tight drop-shadow sm:text-5xl"
            />
          )}

          {cena.sub && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.92, y: 0 }}
              transition={{ delay: 0.45 }}
              className="retro-editorial-sub mt-3 text-[17px] leading-relaxed"
            >
              {cena.sub}
            </motion.p>
          )}

          {cena.key === "questions" && dados.questions.length > 0 && (
            <QuestionsScene
              questions={dados.questions}
              answers={respostas}
              onAnswer={(chave, opcao) => setRespostas((atuais) => ({ ...atuais, [chave]: opcao }))}
            />
          )}

          {cena.question && cena.key !== "questions" && (
            <div className="mt-5 w-full max-w-xs space-y-2">
              {cena.question.options.map((opcao, indice) => {
                const selecionada = respostas[cena.key] === indice;
                return (
                  <button
                    key={indice}
                    onClick={(evento) => {
                      evento.stopPropagation();
                      setRespostas((atuais) => ({ ...atuais, [cena.key]: indice }));
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition active:scale-[0.98] ${
                      selecionada
                        ? "bg-white/30 text-white font-medium"
                        : respostas[cena.key] !== undefined
                          ? "bg-white/5 text-white/40"
                          : "bg-white/15 text-white/80 hover:bg-white/25"
                    }`}
                  >
                    {selecionada && <span className="mr-2 inline-block align-[-2px]"><IconCheck size={15} /></span>}
                    {opcao}
                  </button>
                );
              })}
            </div>
          )}

          {cena.chips && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {cena.chips.map((etiqueta, indice) => (
                <motion.span
                  key={etiqueta}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + indice * 0.1 }}
                  className="rounded-full bg-white/20 px-4 py-2 text-lg font-semibold backdrop-blur"
                >
                  #{etiqueta}
                </motion.span>
              ))}
            </div>
          )}

          {cena.key === "other-semester" && outroSemestre && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6">
              <a
                href={`/app/retrospectiva?ano=${dados.year}&semestre=${outroSemestre}`}
                className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur transition", classeAcaoSecundaria)}
              >
                Ver {outroSemestre}º semestre completo
              </a>
            </motion.div>
          )}

          {ultimo && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-col items-center gap-2.5">
              <button
                onClick={aoGerarVideo}
                disabled={gravando}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[#9575E8] shadow-2xl transition hover:scale-105 disabled:opacity-70"
              >
                {gravando ? <IconSpinner size={19} className="animate-spin" /> : <IconFilm size={19} />}
                {gravando ? `Gerando vídeo… ${progressoGravacao}%` : "Baixar em vídeo"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={aoCompartilhar}
                  disabled={compartilhando}
                  className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm backdrop-blur transition disabled:opacity-70", classeAcaoSecundaria)}
                >
                  {compartilhando ? <IconSpinner size={15} className="animate-spin" /> : <IconPicture size={15} />} Imagem
                </button>
                <button
                  onClick={aoReiniciar}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm backdrop-blur transition", classeAcaoSecundaria)}
                >
                  <IconReplay size={15} /> Ver de novo
                </button>
              </div>
              {!dados.allTime && outroSemestre && (
                <a
                  href={`/app/retrospectiva?ano=${dados.year}&semestre=${outroSemestre}`}
                  className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm backdrop-blur transition", classeAcaoSecundaria)}
                >
                  Ver {outroSemestre}º semestre
                </a>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
