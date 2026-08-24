"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, MapPin, Gift, Sparkles, ArrowRight, Loader2, Check, RotateCcw, ExternalLink } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, duration, EASE_OUT } from "@/nucleo/movimento";
import { IconCadeado, IconPresente } from "./Icones";

interface Pista {
  id: number;
  title: string;
  hint: string;
  page: string;
  emoji: string;
}

const PISTAS: Pista[] = [
  {
    id: 1,
    title: "Onde tudo começa",
    hint: "Procure na página inicial do diário... onde as memórias aparecem primeiro.",
    page: "/app",
    emoji: "🏠",
  },
  {
    id: 2,
    title: "Corações conectados",
    hint: "Vá até a página que mostra a conexão de vocês... onde tem pontos e nível.",
    page: "/app/nos",
    emoji: "💞",
  },
  {
    id: 3,
    title: "Guardião das memórias",
    hint: "O bichinho de vocês sabe de tudo... visite-o!",
    page: "/app/bichinho",
    emoji: "🐱",
  },
  {
    id: 4,
    title: "Mapa do tesouro",
    hint: "No mapa das memórias, cada lugar conta uma história.",
    page: "/app/mapa",
    emoji: "🗺️",
  },
  {
    id: 5,
    title: "Nossa melodia",
    hint: "A rádio de vocês guarda a trilha sonora do amor.",
    page: "/app/radio",
    emoji: "🎵",
  },
  {
    id: 6,
    title: "Baú do tesouro",
    hint: "As tarefas e listas compartilhadas escondem surpresas.",
    page: "/app/tarefas",
    emoji: "📋",
  },
  {
    id: 7,
    title: "O grande final",
    hint: "Volte aqui e insira o código secreto: a data do primeiro beijo (DDMM)",
    page: "",
    emoji: "🎁",
  },
];

// Chave de persistência: sem isso o progresso some sempre que o casal segue
// uma pista para outra página do app (a própria mecânica do jogo derrubava o estado).
const STORAGE_KEY = "enlace-caca-tesouro";

type Phase = "intro" | "hunting" | "final" | "done";

interface SavedState {
  phase: Phase;
  currentClue: number;
  found: number[];
}

const DEFAULT_STATE: SavedState = { phase: "intro", currentClue: 0, found: [] };

function loadState(): SavedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.currentClue === "number" &&
      Array.isArray(parsed.found) &&
      ["intro", "hunting", "final", "done"].includes(parsed.phase)
    ) {
      return {
        phase: parsed.phase,
        currentClue: Math.min(Math.max(0, parsed.currentClue), PISTAS.length - 1),
        found: parsed.found.filter((n: unknown) => typeof n === "number"),
      };
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// Pequena chuva de confetes para a tela final — feita só de divs, sem libs novas.
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: 4 + ((i * 37) % 92),
  delay: (i % 7) * 0.09,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6),
  emoji: ["💖", "✨", "🎉", "💜"][i % 4],
}));

export function CacaTesouro() {
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentClue, setCurrentClue] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [found, setFound] = useState<number[]>([]);
  const hasSaved = useRef(false);

  // Carrega o progresso salvo assim que o componente monta no navegador.
  useEffect(() => {
    const saved = loadState();
    setPhase(saved.phase);
    setCurrentClue(saved.currentClue);
    setFound(saved.found);
    hasSaved.current = saved.phase !== "intro";
    setHydrated(true);
  }, []);

  // Salva a cada mudança (depois da carga inicial, pra não sobrescrever com o estado padrão).
  useEffect(() => {
    if (!hydrated) return;
    saveState({ phase, currentClue, found });
  }, [hydrated, phase, currentClue, found]);

  const start = () => {
    setPhase("hunting");
    setCurrentClue(0);
    setFound([]);
    setCode("");
    setCodeError(false);
  };

  const nextClue = () => {
    const next = currentClue + 1;
    if (next >= PISTAS.length - 1) {
      setFound((f) => [...f, currentClue]);
      setPhase("final");
    } else {
      setFound((f) => [...f, currentClue]);
      setCurrentClue(next);
    }
  };

  const checkCode = () => {
    if (code === "1402") {
      setPhase("done");
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 1500);
    }
  };

  const clue = PISTAS[currentClue];
  const pulse = reduceMotion ? undefined : { scale: [1, 1.08, 1] };

  if (!hydrated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-faint">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl text-text">
          Caça ao <span className="text-warning">Tesouro</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Siga as pistas espalhadas pelo diário de vocês
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: duration.base, ease: EASE_OUT }}
              className="card flex flex-col items-center gap-5 p-6 text-center sm:p-8">
              <motion.div animate={pulse} transition={{ duration: 2, repeat: Infinity }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/15">
                <Search size={36} className="text-warning" />
              </motion.div>
              <div>
                <div className="font-display text-xl text-text">Um tesouro escondido</div>
                <p className="mt-1 text-sm text-faint">
                  7 pistas espalhadas pelas páginas do diário de vocês. Cada uma leva à próxima, até encontrar o tesouro final.
                </p>
              </div>
              {hasSaved.current && (
                <p className="text-xs text-muted">Começar de novo apaga a caçada em andamento.</p>
              )}
              <button onClick={start}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-warning px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                <Sparkles size={17} /> {hasSaved.current ? "Recomeçar caçada" : "Começar caçada"}
              </button>
            </motion.div>
          )}

          {phase === "hunting" && clue && (
            <motion.div key={`clue-${currentClue}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={spring.snappy}
              className="card flex flex-col items-center gap-5 p-6 text-center sm:p-8">
              <div className="text-5xl">{clue.emoji}</div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-warning">
                  Pista {currentClue + 1} de {PISTAS.length}
                </span>
                <h3 className="mt-2 font-display text-2xl text-text">{clue.title}</h3>
                <p className="mt-2 text-sm text-muted">{clue.hint}</p>
              </div>

              {clue.page && (
                <div className="flex w-full flex-col items-center gap-2">
                  <Link
                    href={clue.page}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface2 px-4 py-2.5 text-sm text-muted transition hover:border-warning/50 hover:text-text sm:w-auto"
                  >
                    <MapPin size={14} className="text-warning shrink-0" />
                    <span>
                      Vá até <b className="text-text">{clue.page}</b>
                    </span>
                    <ExternalLink size={13} className="shrink-0 opacity-60" />
                  </Link>
                  <p className="text-xs text-faint">O progresso fica salvo — pode ir e voltar sem medo.</p>
                </div>
              )}

              <div className="flex gap-3">
                {clue.page ? (
                  <button onClick={nextClue}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-warning px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                    <Check size={17} /> Encontrei!
                  </button>
                ) : (
                  <button onClick={nextClue}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-warning px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                    <ArrowRight size={17} /> Próxima
                  </button>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {PISTAS.map((_, i) => (
                  <span key={i} className={cn(
                    "h-2 rounded-full transition-all",
                    i === currentClue ? "w-6 bg-warning" : found.includes(i) ? "w-2 bg-warning/40" : "w-2 bg-border2"
                  )} />
                ))}
              </div>
            </motion.div>
          )}

          {phase === "final" && (
            <motion.div key="final" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: duration.base, ease: EASE_OUT }}
              className="card flex flex-col items-center gap-5 p-6 text-center sm:p-8">
              <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="text-warning"><IconCadeado size={54} /></motion.div>
              <div>
                <div className="font-display text-2xl text-text">Código secreto</div>
                <p className="mt-1 text-sm text-muted">
                  Digite a data do primeiro beijo de vocês (DDMM)
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setCodeError(false); }}
                onKeyDown={(e) => e.key === "Enter" && code.length === 4 && checkCode()}
                placeholder="DDMM"
                className={cn(
                  "w-32 rounded-xl border bg-surface2 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-text placeholder:text-faint focus:border-warning focus:outline-none",
                  codeError ? "border-danger animate-shake" : "border-border"
                )}
              />
              {codeError && <p className="text-xs text-danger">Código incorreto, tente novamente!</p>}
              <button onClick={checkCode} disabled={code.length !== 4}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-warning px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-40">
                <Gift size={17} /> Abrir tesouro
              </button>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring.snappy}
              className="card relative flex flex-col items-center gap-5 overflow-hidden p-6 text-center sm:p-8">
              {!reduceMotion && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {CONFETTI.map((c) => (
                    <motion.span
                      key={c.id}
                      className="absolute top-0 text-xl"
                      style={{ left: `${c.left}%` }}
                      initial={{ y: -20, opacity: 0, x: 0, rotate: 0 }}
                      animate={{ y: 260, opacity: [0, 1, 1, 0], x: c.drift, rotate: c.drift * 4 }}
                      transition={{ duration: 2.2, delay: c.delay, ease: EASE_OUT }}
                    >
                      {c.emoji}
                    </motion.span>
                  ))}
                </div>
              )}
              <motion.div
                animate={reduceMotion ? undefined : { rotate: [0, -10, 10, -8, 0], scale: [1, 1.3, 1.1, 1.2, 1] }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="relative z-10 text-accent"><IconPresente size={64} /></motion.div>
              <div className="relative z-10">
                <div className="font-display text-2xl text-warning">Tesouro encontrado!</div>
                <p className="mt-2 text-sm text-muted max-w-xs mx-auto">
                  O maior tesouro que vocês têm é a história que construíram juntos. Cada memória, cada risada, cada desafio superado — tudo está guardado aqui, no diário de vocês.
                </p>
                <p className="mt-3 text-sm font-semibold text-accent">
                  💜 Com amor, do Enlace para vocês.
                </p>
              </div>
              <button onClick={start}
                className="relative z-10 flex min-h-[44px] items-center gap-2 rounded-xl bg-warning px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                <RotateCcw size={17} /> Jogar de novo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
