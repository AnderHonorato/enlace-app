"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Send, SkipForward, RotateCcw, Check, X, Play, Pause, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";
import { api } from "@/nucleo/cliente";
import { IconBrilho } from "./Icones";

interface Song {
  artist: string;
  year: number;
  title: string;
  hint: string;
  emoji: string;
}

const XP_PER_CORRECT = 40;
const XP_PER_HINT_PENALTY = 10;

/**
 * Quanto do trecho toca a cada escuta. Começa curtinho e vai abrindo, no
 * estilo do Heardle: dá pra reconhecer sem entregar a música de cara — e
 * ouvir não custa XP, só as dicas custam.
 */
const ESCUTAS = [5, 10, 20, 30];

const SONGS: Song[] = [
  { artist: "Legião Urbana", year: 1986, title: "Tempo Perdido", hint: "Reflete sobre o tempo e a juventude", emoji: "⏳🎸" },
  { artist: "Legião Urbana", year: 1985, title: "Eduardo e Mônica", hint: "História de amor entre dois opostos", emoji: "👫💕" },
  { artist: "Cazuza", year: 1988, title: "Exagerado", hint: "Um amor intenso e dramático", emoji: "🎭❤️" },
  { artist: "Cazuza", year: 1985, title: "O Tempo Não Para", hint: "A vida continua apesar de tudo", emoji: "⏰🔥" },
  { artist: "Os Paralamas do Sucesso", year: 1990, title: "Lanterna dos Afogados", hint: "Uma luz na escuridão para quem se sente perdido", emoji: "🔦🌊" },
  { artist: "Os Paralamas do Sucesso", year: 1986, title: "Alagados", hint: "Sobre desigualdade social e favelas", emoji: "🏚️💧" },
  { artist: "Barão Vermelho", year: 1984, title: "Pro Dia Nascer Feliz", hint: "Mensagem otimista de Cazuza", emoji: "🌅😊" },
  { artist: "Barão Vermelho", year: 1988, title: "O Poeta Está Vivo", hint: "Homenagem a um artista que partiu", emoji: "✍️🕊️" },
  { artist: "Raul Seixas", year: 1974, title: "Gita", hint: "Inspirada na filosofia indiana", emoji: "🕉️📖" },
  { artist: "Raul Seixas", year: 1976, title: "Maluco Beleza", hint: "Hino da contracultura brasileira", emoji: "🤪🌈" },
  { artist: "Rita Lee", year: 1980, title: "Lança Perfume", hint: "Hit dançante com perfume francês", emoji: "💃🧴" },
  { artist: "Rita Lee", year: 1982, title: "Baila Comigo", hint: "Convite para dançar e sonhar", emoji: "🕺✨" },
  { artist: "Caetano Veloso", year: 1972, title: "Você é Linda", hint: "Elogio poético à beleza", emoji: "🌹👀" },
  { artist: "Caetano Veloso", year: 1982, title: "Sampa", hint: "Canção de amor a uma cidade cinza", emoji: "🏙️🎵" },
  { artist: "Chico Buarque", year: 1972, title: "Construção", hint: "Uma tragédia operária em proparoxítonas", emoji: "🏗️😢" },
  { artist: "Chico Buarque", year: 1978, title: "O Que Será", hint: "Perguntas sobre o mistério do desejo", emoji: "❓💭" },
  { artist: "Maria Bethânia", year: 1999, title: "Reconvexo", hint: "Versos de Caetano sobre ancestralidade", emoji: "🌴🎤" },
  { artist: "Djavan", year: 1999, title: "Eu Te Devoro", hint: "Amor avassalador que consome", emoji: "🔥👄" },
  { artist: "Djavan", year: 1980, title: "Flor de Lis", hint: "Amor não correspondido e desilusão", emoji: "⚜️💔" },
  { artist: "Marisa Monte", year: 1991, title: "Ainda Bem", hint: "Gratidão por encontrar o amor certo", emoji: "😌💖" },
  { artist: "Marisa Monte", year: 1991, title: "Amor I Love You", hint: "Citação de romance clássico brasileiro", emoji: "📚❤️" },
  { artist: "Engenheiros do Hawaii", year: 1991, title: "Infinita Highway", hint: "Uma estrada sem fim como metáfora da vida", emoji: "🛣️🚗" },
  { artist: "Titãs", year: 1986, title: "Flores", hint: "Sobre os altos e baixos da vida", emoji: "🌸😐" },
  { artist: "Skank", year: 1996, title: "Garota Nacional", hint: "Sucesso que conquistou a Espanha", emoji: "🇧🇷💃" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AdivinheMusica() {
  const { addXP, markPlayed } = useGameXP();
  /*
   * A rodada vem do servidor, de um catálogo de milhares de faixas. As 24
   * músicas que ficavam cravadas aqui acabavam rápido e sempre na mesma ordem;
   * agora cada rodada é sorteada, com viés para as mais conhecidas.
   * A lista fixa continua como rede: se a rota falhar, o jogo não morre.
   */
  const [shuffledSongs, setShuffledSongs] = useState<Song[]>(SONGS);

  useEffect(() => {
    setShuffledSongs(shuffleArray(SONGS));
  }, []);
  const [totalCatalogo, setTotalCatalogo] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSong = shuffledSongs[currentIndex % shuffledSongs.length];

  /** Busca uma rodada nova do catálogo. */
  const carregarRodada = useCallback(async () => {
    try {
      const r = await api<{
        total: number;
        musicas: { artista: string; titulo: string; ano: number | null; genero: string | null }[];
      }>("/api/musicas?n=30");
      if (!r.musicas?.length) return;
      setTotalCatalogo(r.total);
      setShuffledSongs(
        r.musicas.map((m) => ({
          artist: m.artista,
          title: m.titulo,
          year: m.ano ?? 0,
          // Sem dica escrita à mão para música sorteada: o gênero é o que dá
          // para oferecer de verdade sem inventar informação.
          hint: m.genero ? `Estilo: ${m.genero}` : "Sem dica extra dessa vez.",
          emoji: "",
        }))
      );
      setCurrentIndex(0);
    } catch {
      // fica com a lista de reserva
    }
  }, []);

  useEffect(() => {
    carregarRodada();
  }, [carregarRodada]);

  /* ── trecho tocável ─────────────────────────────────────────────────── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pararEm = useRef(0);
  /**
   * O `timeupdate` ainda dispara uma ou duas vezes depois do `pause()`, com o
   * tempo já acima do limite. Sem essa trava, uma única escuta contava como
   * duas e o trecho pulava de 5s direto para 20s.
   */
  const jaCortou = useRef(false);
  const [trecho, setTrecho] = useState<{ url: string | null; capa: string | null } | null>(null);
  const [buscandoTrecho, setBuscandoTrecho] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [escutas, setEscutas] = useState(0);
  const [progresso, setProgresso] = useState(0);

  const limiteAtual = ESCUTAS[Math.min(escutas, ESCUTAS.length - 1)];

  // Busca o trecho da música atual. O servidor guarda em cache, então trocar
  // de música ida e volta não fica pesado.
  useEffect(() => {
    let vivo = true;
    setTrecho(null);
    setEscutas(0);
    setProgresso(0);
    setBuscandoTrecho(true);

    api<{ preview: string | null; capa: string | null }>(
      `/api/musica-preview?artista=${encodeURIComponent(currentSong.artist)}&titulo=${encodeURIComponent(currentSong.title)}`
    )
      .then((r) => {
        if (vivo) setTrecho({ url: r.preview, capa: r.capa });
      })
      .catch(() => {
        if (vivo) setTrecho({ url: null, capa: null });
      })
      .finally(() => {
        if (vivo) setBuscandoTrecho(false);
      });

    return () => {
      vivo = false;
    };
  }, [currentSong.artist, currentSong.title]);

  const pausar = useCallback(() => {
    audioRef.current?.pause();
    setTocando(false);
  }, []);

  // Ao trocar de música, o áudio anterior tem que parar — senão duas músicas
  // tocam juntas quando a pessoa pula rápido.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [currentIndex]);

  const ouvir = useCallback(() => {
    const a = audioRef.current;
    if (!a || !trecho?.url) return;
    if (tocando) {
      pausar();
      return;
    }
    // Depois de acertar/errar, libera o trecho inteiro.
    pararEm.current = showResult ? 30 : limiteAtual;
    jaCortou.current = false;
    a.currentTime = 0;
    a.play()
      .then(() => setTocando(true))
      .catch(() => setTocando(false));
  }, [trecho, tocando, pausar, limiteAtual, showResult]);

  /** Corta no limite da escuta atual e alimenta a barrinha de progresso. */
  const aoAtualizarTempo = useCallback(() => {
    const a = audioRef.current;
    if (!a || jaCortou.current) return;
    setProgresso(Math.min(1, a.currentTime / pararEm.current));
    if (a.currentTime >= pararEm.current) {
      jaCortou.current = true;
      a.pause();
      setTocando(false);
      setProgresso(0);
      if (!showResult) setEscutas((e) => Math.min(e + 1, ESCUTAS.length - 1));
    }
  }, [showResult]);

  const firstLetters = useMemo(() => {
    return currentSong.title
      .split(" ")
      .map((w) => w[0])
      .join(" ");
  }, [currentSong]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const guess = input.trim().toLowerCase();
    const correct = currentSong.title.toLowerCase();
    const isCorrect = guess === correct || guess.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === correct.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    setTotalAttempted((t) => t + 1);
    markPlayed();
    // Silencia o trecho na hora de revelar a resposta.
    audioRef.current?.pause();
    setTocando(false);
    setProgresso(0);

    if (isCorrect) {
      setShowResult("correct");
      const xpGain = Math.max(5, XP_PER_CORRECT - hintsUsed * XP_PER_HINT_PENALTY);
      addXP(xpGain);
      setScore((s) => s + xpGain);
    } else {
      setShowResult("wrong");
    }
  }, [input, currentSong, hintsUsed, addXP, markPlayed]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= shuffledSongs.length) {
      setShuffledSongs(shuffleArray(SONGS));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
    setInput("");
    setHintsUsed(0);
    setShowResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIndex, shuffledSongs.length]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleReset = useCallback(() => {
    setShuffledSongs(shuffleArray(SONGS));
    setCurrentIndex(0);
    setInput("");
    setHintsUsed(0);
    setShowResult(null);
    setScore(0);
    setTotalAttempted(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleHint = useCallback(() => {
    if (hintsUsed < 3) {
      setHintsUsed((h) => h + 1);
    }
  }, [hintsUsed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const renderHint = (level: number) => {
    if (level === 1) return `Primeira letra: "${firstLetters}"`;
    if (level === 2) return `Ano: ${currentSong.year}`;
    if (level === 3) return `Dica: ${currentSong.hint}`;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text">
            Adivinhe a <span className="gradient-text">Música</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Score: {score} XP — {totalAttempted} tentativa{totalAttempted !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-muted/40 hover:text-text"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={spring.snappy}
          className="rounded-2xl border border-border bg-surface p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-2xl">
              {/* a capa só aparece depois de responder — antes entregaria o jogo */}
              {showResult && trecho?.capa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trecho.capa} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : currentSong.emoji ? (
                currentSong.emoji
              ) : (
                // Música sorteada do catálogo não tem emoji escolhido a dedo —
                // entra o ícone do app, pulsando junto com o áudio.
                <motion.span
                  className="text-accent"
                  animate={tocando ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={tocando ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                >
                  <IconBrilho size={26} />
                </motion.span>
              )}
            </span>
            <div>
              <p className="font-display text-lg text-text">{currentSong.artist}</p>
              <p className="text-xs text-muted">
                Artista — {currentIndex + 1} de{" "}
                {(totalCatalogo ?? shuffledSongs.length).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Trecho tocável */}
          <div className="rounded-xl border border-border bg-bg2 p-3">
            {buscandoTrecho ? (
              <div className="flex items-center gap-2 py-1 text-sm text-muted">
                <Loader2 size={15} className="animate-spin" />
                Procurando o trecho…
              </div>
            ) : trecho?.url ? (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={ouvir}
                    aria-label={tocando ? "Pausar o trecho" : "Ouvir o trecho"}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-110"
                  >
                    {tocando ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-text">
                      <Volume2 size={14} className="text-accent" />
                      {showResult
                        ? "Trecho completo"
                        : tocando
                          ? `Tocando ${limiteAtual}s`
                          : escutas === 0
                            ? `Ouvir ${limiteAtual}s`
                            : `Ouvir mais — ${limiteAtual}s`}
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-full rounded-full accent-gradient"
                        animate={{ width: `${progresso * 100}%` }}
                        transition={{ duration: 0.15, ease: "linear" }}
                      />
                    </div>
                  </div>
                </div>

                {!showResult && (
                  <p className="mt-2 text-[11px] text-faint">
                    Cada escuta libera um pedaço maior — e ouvir não tira XP, só as dicas tiram.
                  </p>
                )}

                <audio
                  ref={audioRef}
                  src={trecho.url}
                  preload="none"
                  onTimeUpdate={aoAtualizarTempo}
                  onEnded={() => {
                    setTocando(false);
                    setProgresso(0);
                  }}
                />
              </>
            ) : (
              <p className="py-1 text-sm text-muted">
                Não encontramos um trecho dessa música — vale usar as dicas.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((hintNum) => {
              const used = hintNum <= hintsUsed;
              return (
                <button
                  key={hintNum}
                  onClick={() => {
                    if (!used) handleHint();
                  }}
                  disabled={used || hintsUsed >= hintNum}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    used
                      ? "bg-accent/15 text-accent"
                      : "border border-border text-muted hover:border-muted/40 hover:text-text"
                  )}
                >
                  <Lightbulb size={12} />
                  {used ? renderHint(hintNum) : `Dica ${hintNum}`}
                </button>
              );
            })}
          </div>

          {showResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.bouncy}
              className={cn(
                "rounded-xl border p-4 flex items-center gap-3",
                showResult === "correct"
                  ? "border-success/30 bg-success/10"
                  : "border-danger/30 bg-danger/10"
              )}
            >
              {showResult === "correct" ? (
                <>
                  <Check size={20} className="text-success shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-success">Correto!</p>
                    <p className="text-sm text-text">
                      &ldquo;{currentSong.title}&rdquo; — {currentSong.artist}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      +{Math.max(5, XP_PER_CORRECT - hintsUsed * XP_PER_HINT_PENALTY)} XP
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <X size={20} className="text-danger shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-danger">Não foi dessa vez!</p>
                    <p className="text-sm text-text">
                      Resposta: &ldquo;{currentSong.title}&rdquo; — {currentSong.artist}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite o nome da música..."
                className="flex-1 rounded-xl border border-border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  input.trim()
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-muted/10 text-muted cursor-not-allowed"
                )}
              >
                <Send size={14} />
                Chutar
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {!showResult ? (
              <button
                onClick={handleSkip}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2 text-sm text-muted transition hover:text-text hover:border-muted/40"
              >
                <SkipForward size={14} />
                Pular
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Próxima música
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
