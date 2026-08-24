"use client";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, X, Star } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { fadeUp, listItem } from "@/nucleo/movimento";
import { PACOTES, type AccentToken } from "@/nucleo/quiz";
import { useGameXP } from "./ExperienciaJogos";
import { PainelPontuacao } from "./PainelPontuacao";
import { GameArt, type GameArtKind } from "./ArteJogo";
import { convidarParaJogo } from "./jogos/usarSessaoJogo";
import type { GameSlug } from "@/nucleo/jogos";
import { toast } from "./Avisos";

function GameLoading() {
  return (
    <div className="scrap-frame scrap-frame-quiet grid min-h-[320px] place-items-center rounded-3xl border border-border bg-surface">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-border2 border-t-accent" />
        <p className="mt-3 text-sm font-semibold text-muted">Preparando o jogo…</p>
      </div>
    </div>
  );
}

// Cada jogo vira um pacote independente. A Central baixa somente o catálogo e
// a arte dos cards; as regras e tabuleiros chegam quando a pessoa abre o jogo.
const JogoVerdade = dynamic(() => import("./JogoVerdade").then((m) => m.JogoVerdade), { loading: GameLoading });
const QuizCasal = dynamic(() => import("./QuizCasal").then((m) => m.QuizCasal), { loading: GameLoading });
const DesafioRelampago = dynamic(() => import("./DesafioRelampago").then((m) => m.DesafioRelampago), { loading: GameLoading });
const LoveQuestHub = dynamic(() => import("./JornadaDoCasal").then((m) => m.LoveQuestHub), { loading: GameLoading });
const TicTacToeAmor = dynamic(() => import("./JogoDaVelhaAmor").then((m) => m.TicTacToeAmor), { loading: GameLoading });
const CampanhaModo = dynamic(() => import("./CampanhaModo").then((m) => m.CampanhaModo), { loading: GameLoading });
const CompleteFrase = dynamic(() => import("./CompleteFrase").then((m) => m.CompleteFrase), { loading: GameLoading });
const AdivinheMusica = dynamic(() => import("./AdivinheMusica").then((m) => m.AdivinheMusica), { loading: GameLoading });
const QuizFilmeEmoji = dynamic(() => import("./QuizFilmeEmoji").then((m) => m.QuizFilmeEmoji), { loading: GameLoading });
const StopAdedonha = dynamic(() => import("./Adedonha").then((m) => m.StopAdedonha), { loading: GameLoading });
const MotorQuiz = dynamic(() => import("./QuizMotor").then((m) => m.MotorQuiz), { loading: GameLoading });

type Category = "classicos" | "rapidos" | "quizzes" | "conhecimento" | "aventura";

type GameDef = {
  key: string;
  /** Jogo em página própria. Mutuamente exclusivo com `render`. */
  href?: string;
  /**
   * Jogo que abre dentro do hub. Guardar o próprio JSX aqui é o que permite
   * registrar um jogo novo sem tocar em mais nada: antes era preciso somar a
   * chave a um union type e mais um `case` num switch de renderização.
   */
  render?: () => ReactNode;
  art: GameArtKind;
  title: string;
  desc: string;
  badge?: string;
  accent: AccentToken;
  category: Category;
};

// Classes literais (não interpoladas) para o Tailwind conseguir escanear e
// gerar cada uma — ver tailwind.config.ts para o que cada token vira em CSS.
const TOKEN_STYLES: Record<AccentToken, { blob: string; hoverText: string }> = {
  accent: { blob: "bg-accent", hoverText: "group-hover:text-accent" },
  accent2: { blob: "bg-accent2", hoverText: "group-hover:text-accent2" },
  warning: { blob: "bg-warning", hoverText: "group-hover:text-warning" },
  success: { blob: "bg-success", hoverText: "group-hover:text-success" },
  danger: { blob: "bg-danger", hoverText: "group-hover:text-danger" },
};

const CATEGORY_LABELS: Record<Category, string> = {
  classicos: "Clássicos",
  rapidos: "Desafios rápidos",
  quizzes: "Quizzes",
  conhecimento: "Conhecimento",
  aventura: "Modo aventura",
};

const CATEGORY_ORDER: Category[] = ["classicos", "rapidos", "quizzes", "conhecimento", "aventura"];

/**
 * As categorias de conhecimento (Geografia, Astronomia, História, Ciência…)
 * são todas o mesmo jogo com conteúdo diferente, então nascem do registro de
 * pacotes em vez de virarem entradas escritas à mão aqui. Categoria nova é um
 * arquivo em `src/nucleo/quiz/` — este componente não muda.
 */
const JOGOS_DE_CONHECIMENTO: GameDef[] = PACOTES.map((pacote) => ({
  key: pacote.key,
  art: "quiz",
  title: [pacote.titulo, pacote.destaque].filter(Boolean).join(" "),
  desc: pacote.desc,
  accent: pacote.accent,
  category: "conhecimento" as const,
  render: () => <MotorQuiz pacote={pacote} />,
}));

const GAMES: GameDef[] = [
  {
    key: "roleta" as const,
    href: "/app/roleta",
    art: "wheel",
    title: "Roleta Surpresa",
    desc: "Gire a roleta e descubra uma surpresa para fazerem juntos",
    accent: "accent",
    category: "classicos",
  },
  {
    key: "wordle" as const,
    href: "/app/wordle",
    art: "words",
    title: "Palavra do Casal",
    desc: "Adivinhe a palavra de 5 letras",
    accent: "success",
    category: "classicos",
  },
  {
    key: "rabisca" as const,
    href: "/app/jogos/rabisca",
    art: "draw",
    title: "Rabisca!",
    desc: "Desenhe, adivinhe e dispute o ranking em salas online",
    badge: "Multiplayer",
    accent: "accent2",
    category: "classicos",
  },
  {
    key: "trofeus" as const,
    href: "/app/trofeus",
    art: "trophy",
    title: "Troféus",
    desc: "Conquistas que vocês desbloquearam juntos",
    accent: "warning",
    category: "classicos",
  },
  {
    key: "verdade" as const,
    art: "truth",
    title: "Jogo da Verdade",
    desc: "Verdade ou desafio para casais",
    accent: "danger",
    category: "rapidos",
    render: () => <JogoVerdade />,
  },
  {
    key: "quiz" as const,
    art: "quiz",
    title: "Quiz do Casal",
    desc: "Teste o quanto vocês se conhecem",
    accent: "accent2",
    category: "quizzes",
    render: () => <QuizCasal />,
  },
  {
    key: "relampago" as const,
    art: "timer",
    title: "Desafio Relâmpago",
    desc: "Desafios rápidos de 60 segundos",
    accent: "warning",
    category: "rapidos",
    render: () => <DesafioRelampago />,
  },
  {
    key: "lovequest" as const,
    art: "quest",
    title: "Love Quest",
    desc: "Roleta, quiz, desafios e timeline num só modo aventura",
    accent: "warning",
    category: "aventura",
    render: () => <LoveQuestHub />,
  },
  {
    key: "tictactoe" as const,
    art: "grid",
    title: "Jogo da Velha do Amor",
    desc: "Estratégia rápida em um tabuleiro feito para dois",
    accent: "accent",
    category: "rapidos",
    render: () => <TicTacToeAmor />,
  },
  {
    key: "campanha" as const,
    art: "trophy",
    title: "Modo Campanha",
    desc: "6 fases com desbloqueáveis, XP e conquistas",
    accent: "warning",
    category: "aventura",
    render: () => <CampanhaModo />,
  },
  {
    key: "complete" as const,
    art: "words",
    title: "Complete a Frase",
    desc: "Frases românticas para vocês completarem",
    accent: "success",
    category: "quizzes",
    render: () => <CompleteFrase />,
  },
  {
    key: "musica" as const,
    art: "music",
    title: "Adivinhe a Música",
    desc: "Descubra a música brasileira pelas dicas",
    accent: "accent2",
    category: "quizzes",
    render: () => <AdivinheMusica />,
  },
  {
    key: "filmeemoji" as const,
    art: "film",
    title: "Pistas de Cinema",
    desc: "Descubra o filme por uma sequência de pistas visuais",
    accent: "danger",
    category: "quizzes",
    render: () => <QuizFilmeEmoji />,
  },
  {
    key: "stop" as const,
    art: "stop",
    title: "Stop / Adedonha",
    desc: "Categorias, letra aleatória, 60 segundos",
    accent: "success",
    category: "rapidos",
    render: () => <StopAdedonha />,
  },
  ...JOGOS_DE_CONHECIMENTO,
];

const PAIR_GAMES: { slug: GameSlug; title: string; desc: string; art: GameArtKind }[] = [
  { slug: "desenho", title: "Duelo de Rabiscos", desc: "Um desenha e o outro corre para adivinhar", art: "draw" },
  { slug: "memoria", title: "Memória Revelada", desc: "Cartas com lembranças reais do casal", art: "cards" },
  { slug: "complete", title: "Frase Secreta", desc: "Completem sem ver a resposta um do outro", art: "words" },
  { slug: "filmeemoji", title: "Pistas em Cartaz", desc: "Descubram o filme antes que a pista termine", art: "film" },
  { slug: "verdade", title: "Verdade em Cena", desc: "Perguntas e desafios em turnos compartilhados", art: "truth" },
  { slug: "velha", title: "Três em Linha", desc: "Partida online, jogada por jogada", art: "grid" },
];

/**
 * Escolhe um "jogo do dia" estável ao longo do dia, pra dar destaque no topo.
 *
 * O deslocamento de 3 horas é o fuso de Brasília: sem ele o dia vira à meia-noite
 * UTC, ou seja, às 21h daqui — o jogo do dia trocava no meio da noite de vocês.
 * Continua sendo a mesma conta no servidor e no navegador (parte do mesmo
 * instante em epoch), então não gera divergência de hidratação.
 */
const FUSO_BR_MS = 3 * 60 * 60 * 1000;

function pickGameOfDay(games: GameDef[]): GameDef {
  const eligible = games.filter((g) => g.key !== "trofeus");
  const dayIndex = Math.floor((Date.now() - FUSO_BR_MS) / 86_400_000);
  return eligible[dayIndex % eligible.length];
}

export function JogosHub() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [startingPair, setStartingPair] = useState<GameSlug | null>(null);
  /** Sobe a cada volta de um jogo para o hub, forçando o placar a rebuscar. */
  const [voltasDoJogo, setVoltasDoJogo] = useState(0);
  const reduceMotion = useReducedMotion();
  const { level, progress } = useGameXP();
  const featured = useMemo(() => pickGameOfDay(GAMES), []);

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        cat,
        games: GAMES.filter((g) => g.category === cat && g.key !== featured.key),
      })).filter((g) => g.games.length > 0),
    [featured]
  );

  const cardHoverProps = reduceMotion
    ? {}
    : { whileHover: { scale: 1.02, y: -2 }, whileTap: { scale: 0.97 } };
  const heroHoverProps = reduceMotion
    ? {}
    : { whileHover: { scale: 1.01, y: -2 }, whileTap: { scale: 0.985 } };

  let cardIndex = 0;
  const nextIndex = () => cardIndex++;

  async function startPairGame(game: GameSlug) {
    setStartingPair(game);
    try {
      const session = await convidarParaJogo(game);
      router.push(`/app/jogos?sessao=${session.id}`);
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } catch (cause: any) {
      toast(cause?.message || "Não foi possível abrir a partida.", "error");
    } finally {
      setStartingPair(null);
    }
  }

  const renderCard = (game: GameDef, index: number) => {
    const tokens = TOKEN_STYLES[game.accent];
    return (
      <motion.div
        variants={listItem}
        custom={index}
        initial="hidden"
        animate="show"
        {...cardHoverProps}
        className="scrap-frame group relative flex min-h-[210px] h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-glow"
      >
        <div
          className={cn(
            "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20",
            tokens.blob
          )}
        />
        <div className={cn("relative h-24 overflow-hidden border-b border-border2 bg-bg2 text-text", tokens.hoverText)}>
          <GameArt kind={game.art} className="absolute inset-0 scale-[1.12] transition-transform duration-300 group-hover:scale-[1.18]" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("font-display text-lg leading-snug text-text transition-colors", tokens.hoverText)}>
              {game.title}
            </div>
            {game.badge ? (
              <span className="rounded-lg border border-accent/25 bg-accent/[0.07] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-accentInk">
                {game.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-faint">{game.desc}</p>
          <span className={cn("mt-auto pt-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted", tokens.hoverText)}>Abrir jogo</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div key="game" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <button
              onClick={() => {
                setActiveGame(null);
                setVoltasDoJogo((n) => n + 1);
              }}
              className="focus-ring mb-4 flex min-h-[40px] items-center gap-1.5 rounded-full px-1 text-sm font-medium text-muted transition hover:text-text"
            >
              <X size={16} />
              Fechar jogo
            </button>
            {activeGame.render?.()}
          </motion.div>
        ) : (
          <motion.div key="hub" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl text-text">
                  Jogos do <span className="gradient-text">Casal</span>
                </h1>
                <p className="mt-1.5 text-sm text-muted">Escolham um jogo e divirtam-se juntos</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
                <Star size={14} className="shrink-0 fill-warning text-warning" />
                <span className="text-text">Nível {level}</span>
                <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-surface2 sm:block">
                  <div
                    className="h-full accent-gradient transition-[width] duration-500"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/*
              Placar do casal antes de qualquer jogo. Fica aqui de propósito:
              é a primeira coisa que a pessoa vê ao abrir, e recarrega toda vez
              que ela volta de uma partida — então o ponto que acabou de ganhar
              aparece na hora.
            */}
            <PainelPontuacao recarregar={voltasDoJogo} />

            <section className="mb-7 mt-6">
              <div className="mb-2.5 flex items-end justify-between gap-3">
                <div><div className="kicker">Joguem juntos, cada um no seu celular</div><p className="mt-1 text-xs text-muted">Convite, presença, pausa automática e placar dentro da partida.</p></div>
                <span className="hidden text-[10px] font-black uppercase tracking-[0.15em] text-success sm:inline">online</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PAIR_GAMES.map((game, index) => (
                  <motion.button
                    key={game.slug}
                    onClick={() => startPairGame(game.slug)}
                    disabled={startingPair !== null}
                    variants={listItem}
                    custom={index}
                    initial="hidden"
                    animate="show"
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="scrap-frame scrap-frame-quiet focus-ring group grid min-h-[118px] grid-cols-[112px_1fr] overflow-hidden border border-border2 bg-surface text-left shadow-soft transition hover:border-text disabled:opacity-55"
                  >
                    <span className="relative h-full overflow-hidden border-r border-border2 bg-bg2 text-text"><GameArt kind={game.art} className="absolute inset-0 scale-110 transition-transform group-hover:scale-[1.17]" /></span>
                    <span className="flex min-w-0 flex-col justify-center p-3"><strong className="font-display text-lg leading-tight">{game.title}</strong><span className="mt-1 text-[11px] leading-relaxed text-muted">{game.desc}</span><span className="mt-2 text-[9px] font-black uppercase tracking-[.14em] text-accentInk">{startingPair === game.slug ? "Abrindo sala" : "Convidar parceiro"}</span></span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Jogo do dia — destaque no topo, sempre em primeiro lugar visual */}
            <div className="kicker mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-warning" />
              Jogo do dia
            </div>
            <div className="mb-6">
              {(() => {
                const game = featured;
                const tokens = TOKEN_STYLES[game.accent];
                const index = nextIndex();
                const content = (
                  <motion.div
                    variants={listItem}
                    custom={index}
                    initial="hidden"
                    animate="show"
                    {...heroHoverProps}
                    className="scrap-frame scrap-frame-botanical group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl border border-warning/30 bg-surface p-5 transition-shadow hover:shadow-glow sm:flex-row sm:items-center"
                  >
                    <div
                      className={cn(
                        "absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-25",
                        tokens.blob
                      )}
                    />
                    <span className="relative h-28 w-full shrink-0 overflow-hidden border border-border2 bg-bg2 text-text sm:h-28 sm:w-40">
                      <GameArt kind={game.art} className="absolute inset-0 scale-105 transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={cn("font-display text-xl leading-snug text-text transition-colors", tokens.hoverText)}>
                          {game.title}
                        </div>
                        {game.badge ? (
                          <span className="rounded-lg border border-accent/25 bg-accent/[0.07] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-accentInk">
                            {game.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{game.desc}</p>
                    </div>
                  </motion.div>
                );

                if (game.render) {
                  return (
                    <button
                      onClick={() => setActiveGame(game)}
                      className="focus-ring block w-full rounded-3xl text-left"
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <Link href={game.href ?? "#"} className="focus-ring block w-full rounded-3xl">
                    {content}
                  </Link>
                );
              })()}
            </div>

            {groups.map(({ cat, games }) => (
              <div key={cat} className="mb-6">
                <div className="kicker mb-2.5">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {games.map((game) => {
                    const index = nextIndex();
                    if (game.render) {
                      return (
                        <button
                          key={game.key}
                          onClick={() => setActiveGame(game)}
                          className="focus-ring block w-full rounded-2xl text-left"
                        >
                          {renderCard(game, index)}
                        </button>
                      );
                    }
                    return (
                      <Link key={game.key} href={game.href ?? "#"} className="focus-ring block w-full rounded-2xl">
                        {renderCard(game, index)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
