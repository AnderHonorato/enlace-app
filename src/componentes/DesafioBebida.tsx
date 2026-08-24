"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Wine, Shuffle, Check, RotateCcw, Sparkles, GlassWater, Beer, Info } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

type Category = "shot" | "sip" | "dare";

interface Challenge {
  text: string;
  category: Category;
}

const CHALLENGES: Challenge[] = [
  { text: "Se você já esqueceu o aniversário do parceiro, beba 2 goles", category: "sip" },
  { text: "Quem beijou primeiro? O outro bebe", category: "sip" },
  { text: "Conte um segredo ou beba um shot", category: "shot" },
  { text: "Faça uma declaração de amor ou beba 3 goles", category: "dare" },
  { text: "Quem é mais ciumento bebe 2 shots", category: "shot" },
  { text: "Troque de roupa com o parceiro ou bebam juntos", category: "dare" },
  { text: "Cante uma música romântica ou beba", category: "dare" },
  { text: "Quem mandou a última mensagem? O outro bebe", category: "sip" },
  { text: "Nunca eu: já deletei mensagem antes do parceiro ler. Quem já fez, bebe", category: "sip" },
  { text: "Fale 3 qualidades do seu amor em 10 segundos ou beba um shot", category: "shot" },
  { text: "Olhe nos olhos do parceiro por 30 segundos sem rir. Quem rir, bebe", category: "dare" },
  { text: "Quem demora mais para se arrumar bebe 2 goles", category: "sip" },
  { text: "Faça uma imitação engraçada do parceiro ou beba", category: "dare" },
  { text: "Conte a história de como se conheceram. Se errar algum detalhe, beba", category: "sip" },
  { text: "Quem é mais grudento bebe um shot", category: "shot" },
  { text: "Mande uma mensagem romântica para o parceiro agora ou beba 3 goles", category: "dare" },
  { text: "Quem ronca? O outro bebe", category: "sip" },
  { text: "Descreva o primeiro beijo. Se o parceiro achar que faltou emoção, você bebe", category: "dare" },
  { text: "Quem pediu em namoro bebe em homenagem ao momento", category: "sip" },
  { text: "Faça uma dancinha sensual ou beba 2 shots", category: "shot" },
  { text: "Elogie o parceiro com 5 adjetivos. Se repetir algum, beba", category: "dare" },
  { text: "Quem é mais bagunceiro bebe 2 goles", category: "sip" },
  { text: "Conte um sonho que você tem com o parceiro ou beba", category: "dare" },
  { text: "Beba um shot para cada ano que estão juntos", category: "shot" },
  { text: "Quem fala mais? O outro bebe", category: "sip" },
  { text: "Faça uma poesia de improviso ou beba 2 shots", category: "shot" },
  { text: "Quem é mais romântico bebe em nome do amor", category: "sip" },
  { text: "Sussurre algo no ouvido do parceiro que você nunca disse ou beba", category: "dare" },
  { text: "Brinde ao futuro de vocês — todos bebem juntos", category: "sip" },
  { text: "Quem acordou de mau humor hoje? Beba um shot", category: "shot" },
];

const CATEGORIES: { key: Category; label: string; icon: any; varName: string }[] = [
  { key: "shot", label: "Shot", icon: GlassWater, varName: "--danger" },
  { key: "sip", label: "Sip", icon: Beer, varName: "--success" },
  { key: "dare", label: "Desafio", icon: Sparkles, varName: "--accent-2" },
];

/** Resolve um token CSS em rgb(), com alpha opcional — evita cravar hex no lugar do tema. */
function rgbVar(varName: string, alpha?: number) {
  return alpha != null ? `rgb(var(${varName}) / ${alpha})` : `rgb(var(${varName}))`;
}

function shuffleDeck<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha o baralho garantindo que a primeira carta não repita a última mostrada. */
function buildQueue(avoid: Challenge | null): Challenge[] {
  const shuffled = shuffleDeck(CHALLENGES);
  if (avoid && shuffled[0]?.text === avoid.text && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

export function DesafioBebida() {
  const [phase, setPhase] = useState<"idle" | "drawing" | "revealed">("idle");
  const [queue, setQueue] = useState<Challenge[]>([]);
  const [current, setCurrent] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState(0);
  const [drawnCount, setDrawnCount] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const reduzMovimento = useReducedMotion();

  const startGame = useCallback(() => {
    const shuffled = buildQueue(null);
    setDrawnCount(0);
    setCompleted(0);
    setShuffling(true);
    setPhase("drawing");
    setTimeout(
      () => {
        setShuffling(false);
        setCurrent(shuffled[0]);
        setQueue(shuffled.slice(1));
        setPhase("revealed");
        setDrawnCount(1);
      },
      reduzMovimento ? 0 : 600
    );
  }, [reduzMovimento]);

  const drawCard = useCallback(() => {
    setShuffling(true);
    setPhase("drawing");
    setTimeout(
      () => {
        setShuffling(false);
        if (queue.length === 0) {
          const fresh = buildQueue(current);
          setCurrent(fresh[0]);
          setQueue(fresh.slice(1));
        } else {
          setCurrent(queue[0]);
          setQueue(queue.slice(1));
        }
        setPhase("revealed");
        setDrawnCount((c) => c + 1);
      },
      reduzMovimento ? 0 : 600
    );
  }, [queue, current, reduzMovimento]);

  const handleDone = () => {
    setCompleted((c) => c + 1);
    setCurrent(null);
  };

  const catInfo = current
    ? CATEGORIES.find((c) => c.key === current.category) ?? CATEGORIES[1]
    : null;

  const cardNumber = ((drawnCount - 1) % CHALLENGES.length) + 1;

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl text-text">
          Desafios com <span className="text-success">Bebida</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Um brinde ao amor! Bebam com responsabilidade.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Wine size={16} className="text-warning" />
            <span className="text-sm text-muted">
              <span className="font-semibold text-text">{completed}</span> desafios completados
            </span>
          </div>
        </div>

        {/* Aviso discreto: moderação + alternativa sem álcool */}
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-border/60 bg-surface2/40 px-3.5 py-2 text-xs text-faint">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            Beba com moderação e no seu ritmo. Sem vontade de álcool? Troque os goles por água,
            suco ou refrigerante — a brincadeira continua igual.
          </span>
        </div>

        <AnimatePresence mode="wait">
          {phase === "idle" && !current && (
            <motion.div
              key="idle"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -12 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              className="card flex flex-col items-center gap-5 p-8"
            >
              <motion.div
                animate={reduzMovimento ? undefined : { rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
              >
                <Wine size={36} className="text-success" />
              </motion.div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Prontos para brindar?
                </div>
                <p className="mt-1 text-sm text-faint">
                  Cartas com desafios, shots e diversão
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map((cat) => (
                  <span
                    key={cat.key}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: rgbVar(cat.varName, 0.3),
                      color: rgbVar(cat.varName),
                    }}
                  >
                    <cat.icon size={12} />
                    {cat.label}
                  </span>
                ))}
              </div>
              <button
                onClick={startGame}
                className="flex min-h-[40px] items-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <Shuffle size={17} />
                Começar jogo
              </button>
            </motion.div>
          )}

          {(phase === "drawing" || shuffling) && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring.soft}
              className="card flex flex-col items-center gap-5 p-10"
            >
              <motion.div
                animate={reduzMovimento ? undefined : { rotate: 360 }}
                transition={{ duration: 0.6, ease: "linear", repeat: Infinity }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
              >
                <Shuffle size={32} className="text-success" />
              </motion.div>
              <p className="font-display text-lg text-text">
                {shuffling ? "Embaralhando..." : "Tirando uma carta..."}
              </p>
              <div className="flex gap-1.5">
                <motion.span
                  animate={reduzMovimento ? undefined : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  className="h-2 w-2 rounded-full bg-success"
                />
                <motion.span
                  animate={reduzMovimento ? undefined : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  className="h-2 w-2 rounded-full bg-success"
                />
                <motion.span
                  animate={reduzMovimento ? undefined : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  className="h-2 w-2 rounded-full bg-success"
                />
              </div>
            </motion.div>
          )}

          {phase === "revealed" && current && catInfo && (
            <motion.div
              key={`card-${current.text}`}
              initial={
                reduzMovimento
                  ? { opacity: 0 }
                  : { opacity: 0, rotate: -8, y: -18, scale: 0.92 }
              }
              animate={
                reduzMovimento
                  ? { opacity: 1 }
                  : { opacity: 1, rotate: 0, y: 0, scale: 1 }
              }
              transition={{ ...spring.bouncy, duration: 0.5 }}
              className="card relative overflow-hidden p-0"
              style={{ borderColor: rgbVar(catInfo.varName, 0.27) }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-8"
                style={{
                  background: `linear-gradient(135deg, transparent, ${rgbVar(catInfo.varName)})`,
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ background: rgbVar(catInfo.varName) }}
                  >
                    <catInfo.icon size={12} /> {catInfo.label}
                  </span>
                  <span className="text-xs text-faint">
                    Carta {cardNumber} de {CHALLENGES.length}
                  </span>
                </div>

                <div className="px-6 py-6 text-center">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduzMovimento ? 0 : 0.2 }}
                    className="font-display text-xl leading-relaxed text-text"
                  >
                    {current.text}
                  </motion.p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4">
                  <button
                    onClick={handleDone}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                    style={{ background: rgbVar(catInfo.varName) }}
                  >
                    <Check size={16} />
                    Feito!
                  </button>
                  <button
                    onClick={() => {
                      setCompleted((c) => c + 1);
                      drawCard();
                    }}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted transition hover:bg-surface2/60 hover:text-text"
                  >
                    <RotateCcw size={16} />
                    Feito + Próxima
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {current === null && phase === "revealed" && (
            <motion.div
              key="next"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={spring.bouncy}
                className="text-4xl"
              >
                🥂
              </motion.div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Saúde!
                </div>
                <p className="mt-1 text-sm text-faint">
                  Mais um desafio concluído com amor
                </p>
              </div>
              <button
                onClick={drawCard}
                className="flex min-h-[40px] items-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <Shuffle size={17} />
                Próxima carta
              </button>
              <button
                onClick={startGame}
                className="text-sm text-muted transition hover:text-text"
              >
                Recomeçar baralho
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
