"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Dices, Brain, Flame, Wine, Heart, Clock, Calendar, X, ChevronLeft } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { fadeUp, listItem } from "@/nucleo/movimento";
import { QuemConheceQuem } from "./QuemConheceQuem";
import { DesafioBebida } from "./DesafioBebida";
import { DesafioRomantico } from "./DesafioRomantico";
import { LoveTimeline } from "./LinhaDoTempoAmor";
import { JogoVerdade } from "./JogoVerdade";

type GameKey =
  | "roleta"
  | "quiz"
  | "verdade"
  | "bebida"
  | "romantico"
  | "capsula"
  | "timeline"
  | null;

/** Cor semântica do jogo — sempre um token de tema, nunca um hex cravado. */
type AccentToken = "accent" | "accent2" | "warning" | "success" | "danger";

type GameDef = {
  key: GameKey;
  icon: any;
  title: string;
  desc: string;
  accent: AccentToken;
  featured?: boolean;
};

// Classes literais (não interpoladas) pro Tailwind conseguir escanear.
const TOKEN_STYLES: Record<AccentToken, { icon: string; blob: string; hoverText: string }> = {
  accent: { icon: "bg-accent", blob: "bg-accent", hoverText: "group-hover:text-accent" },
  accent2: { icon: "bg-accent2", blob: "bg-accent2", hoverText: "group-hover:text-accent2" },
  warning: { icon: "bg-warning", blob: "bg-warning", hoverText: "group-hover:text-warning" },
  success: { icon: "bg-success", blob: "bg-success", hoverText: "group-hover:text-success" },
  danger: { icon: "bg-danger", blob: "bg-danger", hoverText: "group-hover:text-danger" },
};

const GAMES: GameDef[] = [
  {
    key: "roleta",
    icon: Dices,
    title: "Roleta do Casal",
    desc: "Gire a roleta e descubra uma surpresa",
    accent: "warning",
    featured: true,
  },
  {
    key: "quiz",
    icon: Brain,
    title: "Quem Conhece Quem?",
    desc: "Teste o quanto vocês se conhecem",
    accent: "accent2",
  },
  {
    key: "verdade",
    icon: Flame,
    title: "Verdade ou Desafio",
    desc: "Responda ou execute — sem fugir!",
    accent: "danger",
  },
  {
    key: "bebida",
    icon: Wine,
    title: "Desafios com Bebida",
    desc: "Um brinde ao amor com desafios",
    accent: "success",
  },
  {
    key: "romantico",
    icon: Heart,
    title: "Desafios Românticos",
    desc: "Desafios para aquecer o coração",
    accent: "accent",
  },
  {
    key: "timeline",
    icon: Calendar,
    title: "Nossa Timeline",
    desc: "Relembre os momentos mais especiais",
    accent: "warning",
  },
  {
    key: "capsula",
    icon: Clock,
    title: "Cápsula do Tempo",
    desc: "Mensagens para o futuro de vocês",
    accent: "success",
  },
];

export function LoveQuestHub() {
  const [activeGame, setActiveGame] = useState<GameKey>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("enlace-bg-image");
      if (stored) setBgImage(stored);
    } catch {}
  }, []);

  const renderGame = () => {
    switch (activeGame) {
      case "roleta":
        return <InlineRoleta />;
      case "quiz":
        return <QuemConheceQuem />;
      case "verdade":
        return <JogoVerdade />;
      case "bebida":
        return <DesafioBebida />;
      case "romantico":
        return <DesafioRomantico />;
      case "timeline":
        return <LoveTimeline />;
      case "capsula":
        return <CapsulaPage />;
      default:
        return null;
    }
  };

  const cardHoverProps = reduceMotion
    ? {}
    : { whileHover: { scale: 1.02, y: -2 }, whileTap: { scale: 0.97 } };

  // Nomes reais do casal não chegam até este componente (ele não recebe
  // props nem tem acesso a um contexto de usuário) — em vez de cravar
  // nomes fixos, usamos um texto genérico.
  const subtitle = "O modo aventura de vocês dois";

  return (
    <div className="mx-auto max-w-4xl">
      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div
            key="game"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <button
              onClick={() => setActiveGame(null)}
              className="focus-ring mb-5 flex min-h-[40px] items-center gap-1.5 rounded-full px-1 text-sm font-medium text-muted transition hover:text-warning"
            >
              <ChevronLeft size={18} />
              Voltar para o hub
            </button>
            {renderGame()}
          </motion.div>
        ) : (
          <motion.div
            key="hub"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="mb-8 text-center">
              <h1 className="font-display text-4xl text-text">
                Love <span className="text-warning">Quest</span>
              </h1>
              <p className="mt-2 font-display text-lg text-muted">{subtitle}</p>
            </div>

            {bgImage && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative mb-8 overflow-hidden rounded-3xl border border-warning/20"
              >
                <div className="relative aspect-[3/1] w-full">
                  <img
                    src={bgImage}
                    alt="Foto do casal"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="fill-warning text-warning" />
                    <span className="text-sm font-medium text-white/90">
                      Nossa história de amor
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {GAMES.map((game, i) => {
                const tokens = TOKEN_STYLES[game.accent];
                return (
                  <button
                    key={game.key}
                    onClick={() => setActiveGame(game.key)}
                    className="focus-ring block w-full rounded-2xl text-left"
                  >
                    <motion.div
                      variants={listItem}
                      custom={i}
                      initial="hidden"
                      animate="show"
                      {...cardHoverProps}
                      className={cn(
                        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-surface p-4 text-left transition-shadow hover:shadow-glow",
                        game.featured ? "border-warning/35" : "border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20",
                          tokens.blob
                        )}
                      />
                      <span
                        className={cn(
                          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white",
                          tokens.icon
                        )}
                      >
                        <game.icon size={20} />
                      </span>
                      <div className="relative">
                        <div className={cn("font-display text-lg leading-snug text-text transition-colors", tokens.hoverText)}>
                          {game.title}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-faint">
                          {game.desc}
                        </p>
                      </div>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineRoleta() {
  return (
    <div className="card flex flex-col items-center gap-5 p-10 text-center">
      <Dices size={40} className="text-warning" />
      <div>
        <h2 className="font-display text-2xl text-text">
          Roleta do <span className="text-warning">Casal</span>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Acesse a roleta completa com mais opções e personalização.
        </p>
      </div>
      <a
        href="/app/roleta"
        className="focus-ring inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-warning px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        <Dices size={17} />
        Abrir Roleta
      </a>
    </div>
  );
}

function CapsulaPage() {
  return (
    <div className="card flex flex-col items-center gap-5 p-10 text-center">
      <Clock size={40} className="text-success" />
      <div>
        <h2 className="font-display text-2xl text-text">
          Cápsula do <span className="text-success">Tempo</span>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Escreva mensagens para vocês lerem no futuro. Seladas com amor.
        </p>
      </div>
      <a
        href="/app/planos"
        className="focus-ring inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
      >
        <Clock size={17} />
        Abrir Cápsula
      </a>
    </div>
  );
}
