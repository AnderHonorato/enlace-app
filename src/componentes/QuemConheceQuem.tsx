"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Brain, Sparkles, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { cn, fmtDate } from "@/nucleo/utilitarios";
import { spring, tap } from "@/nucleo/movimento";
import { api } from "@/nucleo/cliente";

interface Question {
  q: string;
  options: string[];
  correct: number;
  source: string;
}

interface EntryData {
  date: string;
  title: string | null;
  mood: string | null;
  place: string | null;
  author: string;
  snippet: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomPick<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

/**
 * Monta uma pergunta embaralhando as alternativas e recalculando o índice
 * correto DEPOIS do embaralhamento — embaralhar e depois cravar `correct: 0`
 * fazia a resposta certa quase sempre ficar marcada errada.
 */
function buildQuestion(
  correctValue: string,
  distractors: string[],
  q: string,
  source: string
): Question {
  /*
   * Os distratores vêm de outras memórias, então dois podem coincidir (duas
   * memórias no mesmo lugar viravam duas alternativas "Casa"). Como a resposta
   * é conferida por índice, clicar na segunda "Casa" contava como erro. Tirar
   * as repetidas resolve e ainda deixa a pergunta mais limpa.
   */
  const unicos = Array.from(new Set([correctValue, ...distractors]));
  const options = shuffle(unicos);
  return { q, options, correct: options.indexOf(correctValue), source };
}

const SCORE_MESSAGES: Record<number, { emoji: string; title: string; tone: "accent" | "accent2" | "warning" | "danger" }> = {
  5: { emoji: "💘", title: "Almas gêmeas!", tone: "accent" },
  4: { emoji: "😍", title: "Quase perfeito!", tone: "accent2" },
  3: { emoji: "💛", title: "Muito bem!", tone: "warning" },
  2: { emoji: "🤔", title: "Dá pra melhorar...", tone: "danger" },
  1: { emoji: "🙈", title: "Hora do date!", tone: "accent" },
  0: { emoji: "💔", title: "Precisam se reconectar!", tone: "danger" },
};

const TOTAL = 5;

export function QuemConheceQuem() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"loading" | "idle" | "playing" | "done">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scoreAnderson, setScoreAnderson] = useState(0);
  const [scoreMauricio, setScoreMauricio] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Busca entradas reais e gera perguntas
  useEffect(() => {
    api<{ entries: any[] }>("/api/entries?order=asc")
      .then((r) => {
        const entries: EntryData[] = (r.entries || [])
          .filter((e: any) => !e.locked)
          .map((e: any) => ({
            date: fmtDate(e.entryDate),
            title: e.title || null,
            mood: e.mood || null,
            place: e.place || null,
            author: e.author?.displayName || e.author?.name || "Alguém",
            snippet: stripText(e.content || ""),
          }));

        if (entries.length < 3) {
          setPhase("idle");
          setQuestions([]);
          return;
        }

        const generated = generateQuestions(entries);
        setQuestions(generated);
        setPhase("idle");
      })
      .catch(() => {
        setPhase("idle");
        setQuestions([]);
      });
  }, []);

  const initGame = useCallback(() => {
    if (questions.length === 0) return;
    const picked = randomPick(questions, Math.min(TOTAL, questions.length));
    setQuestions(picked);
    setCurrentQ(0);
    setScoreAnderson(0);
    setScoreMauricio(0);
    setSelected(null);
    setRevealed(false);
    setFlipped(false);
    setPhase("playing");
  }, [questions]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const q = questions[currentQ];
    if (idx === q.correct) {
      if (currentQ % 2 === 0) setScoreAnderson((s) => s + 1);
      else setScoreMauricio((s) => s + 1);
    }
  };

  const handleNext = () => {
    setFlipped(true);
    setTimeout(() => {
      if (currentQ + 1 >= Math.min(TOTAL, questions.length)) {
        setPhase("done");
      } else {
        setCurrentQ((c) => c + 1);
        setSelected(null);
        setRevealed(false);
        setFlipped(false);
      }
    }, shouldReduceMotion ? 0 : 350);
  };

  const q = questions[currentQ];
  const totalScore = scoreAnderson + scoreMauricio;
  const roundsPlayed = Math.min(TOTAL, questions.length);
  const pct = roundsPlayed > 0 ? Math.round((totalScore / roundsPlayed) * 100) : 0;
  const result = SCORE_MESSAGES[totalScore] ?? SCORE_MESSAGES[0];

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  if (phase === "idle" && questions.length === 0) {
    return (
      <div className="py-16 text-center">
        <Brain size={40} className="mx-auto text-muted/30" />
        <p className="mt-4 text-muted">Escrevam mais memórias para gerar perguntas personalizadas.</p>
        <p className="mt-1 text-xs text-faint">Mínimo de 3 entradas no diário.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl text-text">
          Quem Conhece <span className="text-accent2">Quem?</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Perguntas baseadas nas memórias que vocês escreveram
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
              className="card flex flex-col items-center gap-5 p-8">
              <motion.div
                animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1] }}
                transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-accent2/15">
                <Brain size={36} className="text-accent2" />
              </motion.div>
              <div className="text-center">
                <div className="font-display text-xl text-text">Anderson & Mauricio</div>
                <p className="mt-1 text-sm text-faint">
                  {questions.length} perguntas geradas das memórias de vocês
                </p>
              </div>
              <motion.button whileTap={tap} onClick={initGame}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                <Sparkles size={17} /> Começar
              </motion.button>
            </motion.div>
          )}

          {phase === "playing" && q && (
            <motion.div key={`q-${currentQ}`}
              initial={{ opacity: 0, rotateY: shouldReduceMotion ? 0 : 90 }} animate={flipped ? "exit" : "show"} exit="exit"
              variants={{
                hidden: { opacity: 0, rotateY: shouldReduceMotion ? 0 : 90 },
                show: { opacity: 1, rotateY: 0 },
                exit: { opacity: 0, rotateY: shouldReduceMotion ? 0 : -90 },
              }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.35 }}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-accent2">
                  Pergunta {currentQ + 1} de {roundsPlayed}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <motion.div className="h-full rounded-full bg-accent2"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQ + 1) / roundsPlayed) * 100}%` }}
                    transition={spring.soft} />
                </div>
              </div>

              <div className="card mb-4 p-6 text-center">
                <p className="text-xs text-faint mb-1">{q.source}</p>
                <p className="font-display text-xl text-text">{q.q}</p>
              </div>

              <div className="space-y-2.5">
                {q.options.map((opt, idx) => {
                  const isSel = selected === idx;
                  const isCor = idx === q.correct;
                  const isWrongPick = revealed && isSel && !isCor;
                  let bg = "bg-surface2 border-border";
                  if (revealed) {
                    if (isCor) bg = "bg-success/15 border-success/50";
                    else if (isSel) bg = "bg-danger/15 border-danger/50";
                  } else if (isSel) {
                    bg = "bg-accent2/10 border-accent2/30";
                  }
                  return (
                    <motion.button key={idx} onClick={() => handleSelect(idx)}
                      disabled={revealed}
                      whileTap={!revealed ? tap : undefined}
                      animate={
                        isWrongPick && !shouldReduceMotion
                          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                          : revealed && isCor && !shouldReduceMotion
                            ? { scale: [1, 1.03, 1] }
                            : { x: 0, scale: 1 }
                      }
                      transition={isWrongPick ? { duration: 0.45 } : spring.snappy}
                      className={cn("flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition disabled:cursor-default", bg,
                        !revealed && "hover:border-accent2/30 hover:bg-accent2/5")}>
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        revealed && isCor ? "bg-success text-white"
                        : isWrongPick ? "bg-danger text-white"
                        : "bg-surface2 text-muted")}>
                        {revealed ? (isCor ? <Check size={14} /> : isSel ? <X size={14} /> : ["A","B","C","D"][idx])
                        : ["A","B","C","D"][idx]}
                      </span>
                      <span className="text-sm text-text">{opt}</span>
                      {revealed && (
                        <span className="ml-auto shrink-0">
                          {isCor ? (
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex justify-center">
                  <motion.button whileTap={tap} onClick={handleNext}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                    {currentQ + 1 >= roundsPlayed ? "Ver resultado" : "Próxima"}
                  </motion.button>
                </motion.div>
              )}

              <div className="mt-3 flex justify-center gap-4 text-xs text-muted">
                <span>Anderson: <b className="text-accent2">{scoreAnderson}</b></span>
                <span>Mauricio: <b className="text-accent2">{scoreMauricio}</b></span>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring.snappy}
              className="card flex flex-col items-center gap-4 p-8 text-center">
              <div className="text-5xl">{result.emoji}</div>
              <div className="font-display text-2xl text-text">{result.title}</div>
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                {totalScore} de {roundsPlayed} · {pct}% de acerto
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col items-center gap-1 rounded-xl bg-accent2/10 px-6 py-3">
                  <span className="text-2xl font-bold text-accent2">{scoreAnderson}</span>
                  <span className="text-xs text-muted">Anderson</span>
                </div>
                <span className="text-2xl text-faint">×</span>
                <div className="flex flex-col items-center gap-1 rounded-xl bg-accent2/10 px-6 py-3">
                  <span className="text-2xl font-bold text-accent2">{scoreMauricio}</span>
                  <span className="text-xs text-muted">Mauricio</span>
                </div>
              </div>
              <p className="text-sm text-muted">
                {scoreAnderson > scoreMauricio ? "Anderson conhece mais o Mauricio!"
                : scoreMauricio > scoreAnderson ? "Mauricio conhece mais o Anderson!"
                : "Empate! Vocês se conhecem igualmente!"}
              </p>
              <motion.button whileTap={tap} onClick={initGame}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                <RotateCcw size={17} /> Jogar de novo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function stripText(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function generateQuestions(entries: EntryData[]): Question[] {
  const qs: Question[] = [];

  // Pega entradas com dados interessantes
  const withPlace = entries.filter((e) => e.place);
  const withMood = entries.filter((e) => e.mood);
  const withTitle = entries.filter((e) => e.title);

  // Perguntas sobre lugares
  for (const e of randomPick(withPlace, 3)) {
    const others = randomPick(withPlace.filter((x) => x !== e), 3);
    const distractors = others.map((o) => o.place!).filter(Boolean).slice(0, 3);
    if (distractors.length < 2) continue;
    qs.push(
      buildQuestion(
        e.place!,
        distractors,
        `Onde foi o momento do dia ${e.date}?`,
        `📍 ${e.author} · ${e.date}`
      )
    );
  }

  // Perguntas sobre humor
  for (const e of randomPick(withMood, 3)) {
    const moods = ["feliz", "animado(a)", "apaixonado(a)", "grato(a)", "calmo(a)", "nostálgico(a)"];
    const wrong = moods.filter((m) => m !== e.mood?.toLowerCase());
    qs.push(
      buildQuestion(
        e.mood!,
        randomPick(wrong, 3),
        `Como ${e.author} estava se sentindo no dia ${e.date}?`,
        `😊 ${e.author} · ${e.date}`
      )
    );
  }

  // Perguntas sobre títulos
  for (const e of randomPick(withTitle, 3)) {
    const others = randomPick(withTitle.filter((x) => x !== e), 3);
    const distractors = others.map((o) => o.title!).filter(Boolean).slice(0, 3);
    if (distractors.length < 2) continue;
    qs.push(
      buildQuestion(
        e.title!,
        distractors,
        `Qual o título da entrada de ${e.date}?`,
        `📝 ${e.author} · ${e.date}`
      )
    );
  }

  // Perguntas sobre quem escreveu
  const authors = [...new Set(entries.map((e) => e.author))];
  if (authors.length >= 2) {
    const picked = randomPick(entries, 3);
    for (const e of picked) {
      const otherAuthor = authors.filter((a) => a !== e.author).slice(0, 1);
      qs.push(
        buildQuestion(
          e.author,
          [...otherAuthor, "Os dois juntos", "Não sei"],
          `Quem escreveu a entrada "${e.title || e.snippet.slice(0, 40)}..." do dia ${e.date}?`,
          `✍️ ${e.date}`
        )
      );
    }
  }

  // Perguntas sobre conteúdo
  const withContent = entries.filter((e) => e.snippet.length > 20);
  for (const e of randomPick(withContent, 3)) {
    const others = randomPick(withContent.filter((x) => x !== e), 3);
    const correctSnippet = e.snippet.slice(0, 60) + "...";
    const distractors = others.map((o) => o.snippet.slice(0, 60) + "...");
    if (distractors.length < 2) continue;
    qs.push(
      buildQuestion(
        correctSnippet,
        distractors,
        `O que ${e.author} escreveu no dia ${e.date}?`,
        `📖 ${e.author} · ${e.date}`
      )
    );
  }

  // Se poucas perguntas, complementa com UMA pergunta genérica (repetir o mesmo
  // texto várias vezes deixava o jogo com perguntas duplicadas de propósito)
  // Só entra se houver de fato dois autores: os nomes tinham que sair do diário,
  // e o código antes caía para "Anderson"/"Mauricio" chumbados — nomes de outro
  // casal apareciam como alternativa no jogo de quem usasse o app.
  if (qs.length < 5 && authors.length >= 2) {
    const correctAuthor = authors[0];
    const distractors = [authors[1], "Empatou", "Não dá pra saber"];
    qs.push(
      buildQuestion(
        correctAuthor,
        distractors,
        "Quem escreveu mais entradas no diário do casal?",
        "📊 Estatísticas do diário"
      )
    );
  }

  // Descarta perguntas com poucas alternativas (dados insuficientes para distrair)
  return shuffle(qs.filter((q) => q.options.length >= 3));
}
