"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, tap } from "@/nucleo/movimento";

interface Question {
  q: string;
  options: string[];
  correct: number;
}

const ALL_QUESTIONS: Question[] = [
  {
    q: "O que é mais importante em um relacionamento?",
    options: ["Confiança", "Aparência", "Dinheiro", "Status"],
    correct: 0,
  },
  {
    q: "Qual a linguagem do amor mais comum entre casais brasileiros?",
    options: [
      "Palavras de afirmação",
      "Toque físico",
      "Tempo de qualidade",
      "Atos de serviço",
    ],
    correct: 0,
  },
  {
    q: "O que fortalece mais um relacionamento?",
    options: ["Comunicação", "Presentes caros", "Ciúmes", "Redes sociais"],
    correct: 0,
  },
  {
    q: "Qual o segredo para um relacionamento duradouro?",
    options: [
      "Respeito e parceria",
      "Nunca discordar",
      "Fazer tudo junto",
      "Ter os mesmos gostos",
    ],
    correct: 0,
  },
  {
    q: "O que fazer quando há um desentendimento?",
    options: [
      "Ouvir com calma e dialogar",
      "Ficar sem se falar",
      "Gritar para desabafar",
      "Ignorar e mudar de assunto",
    ],
    correct: 0,
  },
  {
    q: "Qual desses é um pilar de um relacionamento saudável?",
    options: [
      "Admiração mútua",
      "Dependência total",
      "Controle das redes sociais",
      "Nunca sair sozinho(a)",
    ],
    correct: 0,
  },
  {
    q: "Como demonstrar amor no dia a dia?",
    options: [
      "Pequenos gestos de carinho",
      "Apenas em datas especiais",
      "Comprando coisas caras",
      "Postando nas redes sociais",
    ],
    correct: 0,
  },
  {
    q: "O que significa 'crescer juntos'?",
    options: [
      "Apoiar os sonhos um do outro",
      "Ter exatamente os mesmos objetivos",
      "Passar 24h juntos",
      "Não ter vida individual",
    ],
    correct: 0,
  },
  {
    q: "Qual a melhor forma de construir confiança?",
    options: [
      "Ser transparente e honesto(a)",
      "Compartilhar todas as senhas",
      "Nunca ter amigos",
      "Evitar conversas difíceis",
    ],
    correct: 0,
  },
  {
    q: "O que torna um casal mais feliz?",
    options: [
      "Rir e se divertir juntos",
      "Ter uma casa grande",
      "Viajar todo mês",
      "Ter muitos seguidores",
    ],
    correct: 0,
  },
  {
    q: "Como lidar com as diferenças no relacionamento?",
    options: [
      "Aceitar e respeitar as diferenças",
      "Tentar mudar o outro",
      "Evitar tocar no assunto",
      "Fazer tudo do jeito de um só",
    ],
    correct: 0,
  },
  {
    q: "Qual é o papel do perdão em um relacionamento?",
    options: [
      "Essencial para seguir em frente",
      "Sinal de fraqueza",
      "Só funciona uma vez",
      "Desnecessário se houver amor",
    ],
    correct: 0,
  },
];

const TOTAL = 5;
const LABELS = ["A", "B", "C", "D"];

type Tone = "success" | "accent2" | "warning" | "danger" | "accent";

const SCORE_EMOJI: Record<number, { emoji: string; msg: string; tone: Tone }> = {
  5: { emoji: "🔥", msg: "Perfeito! Vocês são um casal nota mil!", tone: "success" },
  4: { emoji: "😍", msg: "Quase lá! Vocês se conhecem muito bem!", tone: "accent2" },
  3: { emoji: "👀", msg: "Bom! Dá pra melhorar um pouquinho.", tone: "warning" },
  2: { emoji: "🤔", msg: "Precisa conversar mais um com o outro...", tone: "danger" },
  1: { emoji: "🙈", msg: "Hora de um date para se reconectar!", tone: "accent" },
  0: { emoji: "😢", msg: "Bora dar mais atenção ao relacionamento?", tone: "accent" },
};

const TONE_CLASSES: Record<Tone, { text: string; bg: string; bgSoft: string }> = {
  success: { text: "text-success", bg: "bg-success", bgSoft: "bg-success/15" },
  accent2: { text: "text-accent2", bg: "bg-accent2", bgSoft: "bg-accent2/15" },
  warning: { text: "text-warning", bg: "bg-warning", bgSoft: "bg-warning/15" },
  danger: { text: "text-danger", bg: "bg-danger", bgSoft: "bg-danger/15" },
  accent: { text: "text-accent", bg: "bg-accent", bgSoft: "bg-accent/15" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizCasal() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const initGame = useCallback(() => {
    const picked = shuffle(ALL_QUESTIONS).slice(0, TOTAL);
    setQuestions(picked);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setRevealed(false);
    setPhase("playing");
  }, []);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= TOTAL) {
      setPhase("done");
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const q = questions[currentQ];
  const result = SCORE_EMOJI[score] ?? SCORE_EMOJI[0];
  const toneClasses = TONE_CLASSES[result.tone];
  const pct = Math.round((score / TOTAL) * 100);

  const slideX = shouldReduceMotion ? 0 : 40;

  return (
    <div>
      <h2 className="font-display text-3xl text-text">
        Quiz do <span className="gradient-text">Casal</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Descubram o quanto vocês sabem sobre relacionamentos
      </p>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              variants={{
                hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
                show: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: shouldReduceMotion ? 0 : -12 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              className="card flex flex-col items-center gap-5 p-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/12">
                <Sparkles size={28} className="text-accent" />
              </div>
              <div className="text-center">
                <div className="font-display text-xl text-text">
                  Vamos ver o quanto vocês sabem?
                </div>
                <p className="mt-1 text-sm text-faint">
                  {TOTAL} perguntas sobre amor e relacionamento
                </p>
              </div>
              <motion.button
                whileTap={tap}
                onClick={initGame}
                className="flex min-h-[44px] items-center gap-2 rounded-xl accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <Sparkles size={17} />
                Começar quiz
              </motion.button>
            </motion.div>
          )}

          {phase === "playing" && q && (
            <motion.div
              key={`q-${currentQ}`}
              variants={{
                hidden: { opacity: 0, x: slideX },
                show: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -slideX },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {/* Progresso */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Pergunta {currentQ + 1} de {TOTAL}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQ + (revealed ? 1 : 0)) / TOTAL) * 100}%` }}
                    transition={spring.soft}
                  />
                </div>
                <span className="text-xs font-bold text-accent">{score}/{currentQ}</span>
              </div>

              {/* Pergunta */}
              <div className="card p-6">
                <p className="font-display text-xl leading-snug text-text">{q.q}</p>

                <div className="mt-5 space-y-2.5">
                  {q.options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = idx === q.correct;
                    const isWrongPick = revealed && isSelected && !isCorrect;

                    let ringColor = "border-border";
                    let bgColor = "bg-surface2/50";
                    let textColor = "text-text";

                    if (revealed) {
                      if (isCorrect) {
                        ringColor = "border-success/50";
                        bgColor = "bg-success/10";
                        textColor = "text-success";
                      } else if (isWrongPick) {
                        ringColor = "border-danger/50";
                        bgColor = "bg-danger/10";
                        textColor = "text-danger";
                      }
                    } else if (isSelected) {
                      ringColor = "border-accent/60";
                      bgColor = "bg-accent/10";
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={revealed}
                        whileTap={!revealed ? tap : undefined}
                        animate={
                          isWrongPick && !shouldReduceMotion
                            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                            : revealed && isCorrect && !shouldReduceMotion
                              ? { scale: [1, 1.03, 1] }
                              : { x: 0, scale: 1 }
                        }
                        transition={isWrongPick ? { duration: 0.45 } : spring.snappy}
                        className={cn(
                          "flex min-h-[44px] w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
                          ringColor,
                          bgColor,
                          !revealed && "hover:border-accent/40 hover:bg-accent/5"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            revealed && isCorrect
                              ? "bg-success text-white"
                              : isWrongPick
                                ? "bg-danger text-white"
                                : "bg-surface2 text-muted"
                          )}
                        >
                          {LABELS[idx]}
                        </span>
                        <span className={cn("text-sm font-medium", textColor)}>
                          {opt}
                        </span>
                        {revealed && (
                          <span className="ml-auto shrink-0">
                            {isCorrect ? (
                              <Check size={16} className="text-success" />
                            ) : isWrongPick ? (
                              <X size={16} className="text-danger" />
                            ) : null}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <motion.button
                      whileTap={tap}
                      onClick={handleNext}
                      className="w-full min-h-[44px] rounded-xl accent-gradient py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
                    >
                      {currentQ + 1 >= TOTAL ? "Ver resultado" : "Próxima pergunta"}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              variants={{
                hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 },
                show: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 },
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={spring.bouncy}
              className="card flex flex-col items-center gap-5 p-8"
            >
              <motion.div
                initial={{ scale: shouldReduceMotion ? 1 : 0, rotate: shouldReduceMotion ? 0 : -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...spring.bouncy, delay: shouldReduceMotion ? 0 : 0.1 }}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full text-4xl",
                  toneClasses.bgSoft
                )}
              >
                <span>{result.emoji}</span>
              </motion.div>

              <div className="text-center">
                <div className={cn("font-display text-2xl", toneClasses.text)}>
                  {score} de {TOTAL}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-faint">
                  {pct}% de acerto
                </p>
                <p className="mt-2 text-sm text-muted">{result.msg}</p>
              </div>

              {/* Barra de pontuação */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                <motion.div
                  className={cn("h-full rounded-full", toneClasses.bg)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ...spring.soft, delay: shouldReduceMotion ? 0 : 0.3 }}
                />
              </div>

              <motion.button
                whileTap={tap}
                onClick={initGame}
                className="flex min-h-[44px] items-center gap-2 rounded-xl accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                <RotateCcw size={16} />
                Jogar de novo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
