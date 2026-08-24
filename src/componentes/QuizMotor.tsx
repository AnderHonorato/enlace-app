"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RotateCcw, Check, X, Trophy, Lightbulb, Undo2, Info } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";
import { spring, tap } from "@/nucleo/movimento";
import { useGameXP } from "./ExperienciaJogos";
import type { PacoteQuiz } from "@/nucleo/quiz/tipos";
import {
  conferirOrdem,
  montarRodada,
  xpDaPergunta,
  XP_ORDEM,
  XP_RODADA_PERFEITA,
  type Preparada,
} from "@/nucleo/quiz/motor";

export function MotorQuiz({ pacote }: { pacote: PacoteQuiz }) {
  const reduzirMovimento = useReducedMotion();
  const { addXP, markPlayed } = useGameXP();

  const [rodada, setRodada] = useState<Preparada[]>(() => montarRodada(pacote.perguntas, false));
  const [atual, setAtual] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [pistasAbertas, setPistasAbertas] = useState(1);
  const [ordemMontada, setOrdemMontada] = useState<number[]>([]);
  const [acertos, setAcertos] = useState(0);
  const [resultados, setResultados] = useState<boolean[]>([]);
  const [avisoAceito, setAvisoAceito] = useState(!pacote.aviso);

  useEffect(() => {
    setRodada(montarRodada(pacote.perguntas, true));
  }, [pacote]);

  const item = rodada[atual];
  const ultima = atual >= rodada.length - 1;
  const terminou = atual >= rodada.length;

  const limparPergunta = useCallback(() => {
    setEscolhida(null);
    setRevelado(false);
    setPistasAbertas(1);
    setOrdemMontada([]);
  }, []);

  const registrar = useCallback(
    (acertou: boolean, xp: number) => {
      setRevelado(true);
      setResultados((prev) => [...prev, acertou]);
      if (acertou) {
        setAcertos((n) => n + 1);
        addXP(xp, pacote.key);
      }
      markPlayed();
    },
    [addXP, markPlayed, pacote.key]
  );

  const responder = useCallback(
    (indice: number) => {
      if (revelado || !item) return;
      setEscolhida(indice);
      registrar(indice === item.correta, xpDaPergunta(item.q, pistasAbertas));
    },
    [revelado, item, registrar, pistasAbertas]
  );

  const posicionar = useCallback(
    (indice: number) => {
      if (revelado || !item || item.q.tipo !== "ordem" || ordemMontada.includes(indice)) return;
      const montada = [...ordemMontada, indice];
      setOrdemMontada(montada);
      if (montada.length < item.embaralhados.length) return;
      registrar(conferirOrdem(item, montada), XP_ORDEM);
    },
    [revelado, item, ordemMontada, registrar]
  );

  const avancar = useCallback(() => {
    if (ultima) {
      const acertouTudo = acertos === rodada.length;
      if (acertouTudo) addXP(XP_RODADA_PERFEITA, pacote.key);
    }
    setAtual((n) => n + 1);
    limparPergunta();
  }, [ultima, acertos, rodada.length, addXP, pacote.key, limparPergunta]);

  const reiniciar = useCallback(() => {
    setRodada(montarRodada(pacote.perguntas, true));
    setAtual(0);
    setAcertos(0);
    setResultados([]);
    limparPergunta();
  }, [pacote, limparPergunta]);

  const titulo = useMemo(
    () => (
      <>
        {pacote.titulo && `${pacote.titulo} `}
        <span className="gradient-text">{pacote.destaque}</span>
      </>
    ),
    [pacote.titulo, pacote.destaque]
  );

  if (!avisoAceito && pacote.aviso) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduzirMovimento ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="font-display text-3xl text-text">{titulo}</h2>
        <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm leading-relaxed text-muted">{pacote.aviso}</p>
        </div>
        <motion.button
          whileTap={tap}
          onClick={() => setAvisoAceito(true)}
          className="flex w-full min-h-[44px] items-center justify-center rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Entendi, começar
        </motion.button>
      </motion.div>
    );
  }

  if (terminou) {
    const perfeito = acertos === rodada.length;
    const pct = Math.round((acertos / rodada.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: reduzirMovimento ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.bouncy}
        className="space-y-5 rounded-2xl border border-border bg-surface p-8 text-center"
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <Trophy size={28} className="text-accent" />
        </span>
        <h2 className="font-display text-2xl text-text">
          {perfeito ? "Rodada perfeita!" : "Rodada finalizada!"}
        </h2>
        <p className="text-4xl font-bold gradient-text">
          {acertos} / {rodada.length}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">{pct}% de acerto</p>
        {perfeito && (
          <p className="text-sm font-medium text-success">
            +{XP_RODADA_PERFEITA} XP bônus por acertar todas!
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {resultados.map((acertou, i) => (
            <span
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                acertou ? "bg-success/30 text-success" : "bg-danger/30 text-danger"
              )}
            >
              {acertou ? <Check size={14} /> : <X size={14} />}
            </span>
          ))}
        </div>
        <motion.button
          whileTap={tap}
          onClick={reiniciar}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          <RotateCcw size={14} />
          Jogar novamente
        </motion.button>
      </motion.div>
    );
  }

  if (!item) return null;

  const explicacao = item.q.explicacao;
  const podeAbrirPista = item.q.tipo === "pistas" && pistasAbertas < item.q.pistas.length && !revelado;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-text">{titulo}</h2>
          <p className="mt-1 text-sm text-muted">
            {pacote.desc} — {acertos} {acertos === 1 ? "acerto" : "acertos"}
          </p>
        </div>
        <button
          onClick={reiniciar}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-muted/40 hover:text-text"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      <div className="flex gap-1.5">
        {rodada.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < atual && resultados[i] && "bg-success",
              i < atual && !resultados[i] && "bg-danger",
              i === atual && "bg-accent",
              i > atual && "bg-muted/20"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={atual}
          initial={{ opacity: 0, x: reduzirMovimento ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduzirMovimento ? 0 : -20 }}
          transition={spring.snappy}
          className="space-y-5 rounded-2xl border border-border bg-surface p-6"
        >
          <Enunciado item={item} pistasAbertas={pistasAbertas} reduzirMovimento={!!reduzirMovimento} />

          <p className="text-center text-xs font-medium text-muted">
            Pergunta {atual + 1} de {rodada.length}
          </p>

          {podeAbrirPista && (
            <motion.button
              whileTap={tap}
              onClick={() => setPistasAbertas((n) => n + 1)}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-warning/40 bg-warning/10 py-2.5 text-sm font-semibold text-warning transition hover:bg-warning/20"
            >
              <Lightbulb size={15} />
              Abrir mais uma pista (vale menos XP)
            </motion.button>
          )}

          {item.q.tipo === "ordem" ? (
            <Ordenacao
              item={item}
              montada={ordemMontada}
              revelado={revelado}
              reduzirMovimento={!!reduzirMovimento}
              onPosicionar={posicionar}
              onDesfazer={() => setOrdemMontada((m) => m.slice(0, -1))}
            />
          ) : (
            <Alternativas
              item={item}
              escolhida={escolhida}
              revelado={revelado}
              reduzirMovimento={!!reduzirMovimento}
              onResponder={responder}
            />
          )}

          {revelado && explicacao && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5 rounded-xl border border-border bg-surface2 p-3.5"
            >
              <Info size={15} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted">{explicacao}</p>
            </motion.div>
          )}

          {revelado && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={tap}
              onClick={avancar}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              {ultima ? "Ver resultado" : "Próxima"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Cabeçalho da pergunta — muda de forma conforme o tipo. */
function Enunciado({
  item,
  pistasAbertas,
  reduzirMovimento,
}: {
  item: Preparada;
  pistasAbertas: number;
  reduzirMovimento: boolean;
}) {
  const { q } = item;

  if (q.tipo === "pistas") {
    return (
      <div className="space-y-2.5">
        {q.pistas.slice(0, pistasAbertas).map((pista, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: reduzirMovimento ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.snappy}
            className="flex gap-3 rounded-xl border border-border bg-surface2 p-3.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-text">{pista}</p>
          </motion.div>
        ))}
      </div>
    );
  }

  if (q.tipo === "vf") {
    return (
      <div className="text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
          Mito ou fato?
        </span>
        {q.simbolo && <div className="mt-2 text-5xl">{q.simbolo}</div>}
        <p className="mt-2.5 text-lg leading-snug text-text">{q.afirmacao}</p>
      </div>
    );
  }

  // `simbolo` só existe em perguntas de escolha; ordenação não declara o campo.
  const simbolo = "simbolo" in q ? q.simbolo : undefined;

  return (
    <div className="text-center">
      {simbolo && <div className="text-5xl">{simbolo}</div>}
      <p className={cn("text-lg leading-snug text-text", simbolo && "mt-3")}>{q.enunciado}</p>
      {q.tipo === "ordem" && q.dicaOrdem && (
        <span className="mt-2 inline-block rounded-full bg-surface2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
          {q.dicaOrdem}
        </span>
      )}
    </div>
  );
}

/** Grade de alternativas — serve para escolha, verdadeiro/falso e pistas. */
function Alternativas({
  item,
  escolhida,
  revelado,
  reduzirMovimento,
  onResponder,
}: {
  item: Preparada;
  escolhida: number | null;
  revelado: boolean;
  reduzirMovimento: boolean;
  onResponder: (indice: number) => void;
}) {
  const duasColunas = item.q.tipo === "vf";

  return (
    <div className={cn("grid gap-2.5", duasColunas ? "grid-cols-2" : "grid-cols-1")}>
      {item.opcoes.map((opcao, i) => {
        const selecionada = escolhida === i;
        const correta = i === item.correta;
        const erroDoJogador = revelado && selecionada && !correta;

        let borda = "border-border";
        let fundo = "bg-surface2";
        let texto = "text-text";

        if (revelado) {
          if (correta) {
            borda = "border-success/40";
            fundo = "bg-success/10";
            texto = "text-success";
          } else if (erroDoJogador) {
            borda = "border-danger/40";
            fundo = "bg-danger/10";
            texto = "text-danger";
          } else {
            texto = "text-muted";
          }
        }

        return (
          <motion.button
            key={i}
            whileTap={revelado ? undefined : tap}
            animate={
              erroDoJogador && !reduzirMovimento
                ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                : revelado && correta && !reduzirMovimento
                  ? { scale: [1, 1.03, 1] }
                  : { x: 0, scale: 1 }
            }
            transition={erroDoJogador ? { duration: 0.45 } : spring.snappy}
            onClick={() => onResponder(i)}
            disabled={revelado}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
              duasColunas && "justify-center text-center font-semibold",
              borda,
              fundo,
              texto,
              !revelado && "hover:border-accent/30 hover:bg-accent/5"
            )}
          >
            {!duasColunas && (
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  revelado && correta && "border-success text-success",
                  erroDoJogador && "border-danger text-danger",
                  !revelado && "border-border text-muted"
                )}
              >
                {revelado && correta ? (
                  <Check size={12} />
                ) : erroDoJogador ? (
                  <X size={12} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
            )}
            {opcao}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Ordenação por toque: a pessoa vai tocando nos itens na sequência que acha
 * certa. É de propósito que não seja arrastar — arrastar é ruim no celular,
 * que é onde vocês jogam.
 */
function Ordenacao({
  item,
  montada,
  revelado,
  reduzirMovimento,
  onPosicionar,
  onDesfazer,
}: {
  item: Preparada;
  montada: number[];
  revelado: boolean;
  reduzirMovimento: boolean;
  onPosicionar: (indice: number) => void;
  onDesfazer: () => void;
}) {
  const corretos = item.q.tipo === "ordem" ? item.q.itens : [];
  const restantes = item.embaralhados.map((_, i) => i).filter((i) => !montada.includes(i));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {item.embaralhados.map((_, posicao) => {
          const indice = montada[posicao];
          const preenchido = indice !== undefined;
          const acertouPosicao = revelado && preenchido && item.embaralhados[indice] === corretos[posicao];

          return (
            <div
              key={posicao}
              className={cn(
                "flex min-h-[46px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition",
                !preenchido && "border-dashed border-border bg-surface2/40 text-faint",
                preenchido && !revelado && "border-accent/30 bg-accent/5 text-text",
                revelado && acertouPosicao && "border-success/40 bg-success/10 text-success",
                revelado && preenchido && !acertouPosicao && "border-danger/40 bg-danger/10 text-danger"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  preenchido ? "border-current" : "border-border"
                )}
              >
                {posicao + 1}
              </span>
              <span className="min-w-0 flex-1">
                {preenchido ? item.embaralhados[indice] : "—"}
              </span>
              {revelado && !acertouPosicao && (
                <span className="shrink-0 text-[11px] font-semibold text-success">
                  {corretos[posicao]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!revelado && (
        <>
          <div className="flex flex-wrap gap-2">
            {restantes.map((indice) => (
              <motion.button
                key={indice}
                whileTap={tap}
                initial={reduzirMovimento ? undefined : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring.snappy}
                onClick={() => onPosicionar(indice)}
                className="min-h-[40px] rounded-full border border-border bg-surface2 px-4 py-2 text-sm text-text transition hover:border-accent/30 hover:bg-accent/5"
              >
                {item.embaralhados[indice]}
              </motion.button>
            ))}
          </div>

          {montada.length > 0 && (
            <button
              onClick={onDesfazer}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full px-1 text-xs text-muted transition hover:text-text"
            >
              <Undo2 size={13} />
              Desfazer último
            </button>
          )}
        </>
      )}
    </div>
  );
}
