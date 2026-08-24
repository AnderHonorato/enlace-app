"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Pencil, Check, X, Loader2, Sparkles, Dna, TrendingUp } from "lucide-react";
import { Mascote } from "./Mascote";
import { IconCarinha, IconEstrela } from "./Icones";
import { toast } from "./Avisos";
import { api } from "@/nucleo/cliente";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";
import {
  FEATURE_INFO,
  SPECIES_INFO,
  STAGE_INFO,
  STAGE_NAMES,
  mascotFalas,
  type MascotState,
  type MascotFeature,
  type MascotSpecies,
} from "@/nucleo/mascote";

const ALL_FEATURES = Object.keys(FEATURE_INFO) as MascotFeature[];
const ALL_SPECIES = Object.keys(SPECIES_INFO) as MascotSpecies[];

export function BichinhoPage({
  state,
  name: initialName,
  coupled,
}: {
  state: MascotState;
  name: string | null;
  coupled: boolean;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    const value = draft.trim();
    setSaving(true);
    try {
      await api("/api/couple", { method: "PATCH", body: JSON.stringify({ mascotName: value || null }) });
      setName(value);
      setEditing(false);
      toast(value ? `Prazer, ${value}! 💜` : "Nome removido.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const displayName = name || "Seu bichinho";
  const unlocked = new Set(state.features);
  const nextStage = state.stage < 4 ? state.stage + 1 : null;
  const nextStageName = nextStage !== null ? STAGE_NAMES[nextStage] : null;

  return (
    <div>
      <h1 className="mb-1 font-display text-4xl text-text">
        O bichinho <span className="gradient-text">de vocês</span>
      </h1>
      <p className="mb-6 text-sm text-muted">
        Ele nasce e cresce com a história de vocês. A cor, a fase e o humor vêm do que vocês registram.
      </p>

      {/* Palco do bichinho */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b pb-6 text-center",
          state.stage === 4
            ? "from-accent/16 via-accent/10 to-accent2/8 shadow-[0_0_30px_rgba(255,215,0,0.12)]"
            : "from-accent/8 to-accent2/5"
        )}
      >
        <div className="relative h-[260px] overflow-hidden">
          {/* brilho de fundo — mais intenso no lendário */}
          <motion.div
            className={cn(
              "pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl",
              state.stage === 4 ? "bg-yellow-400/20" : "bg-accent/15"
            )}
            animate={
              state.stage === 4
                ? { scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }
                : { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }
            }
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* "quartinho" do bichinho — parede, chão e decorações */}
          <Habitat stage={state.stage} />

          <div className="relative flex h-full items-end justify-center">
            <Mascote state={state} size={230} interactive />
          </div>

          {/* Ele fala do lado, como bichinho de verdade — em vez de crachás de
              status. Fase, espécie e humor viram conversa; os números exatos
              continuam nos cartões abaixo. */}
          <BalaoDoBichinho state={state} nome={name} />
        </div>

        <p className="px-6 pt-2.5 text-xs text-faint">Toque nele para fazer um carinho.</p>

        {/* nome + editar */}
        <div className="relative mt-3 px-6">
          {editing ? (
            <div className="mx-auto flex max-w-xs items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                maxLength={24}
                placeholder="Dê um nome…"
                className="focus-ring flex-1 rounded-xl border border-border bg-bg2 px-3 py-2 text-center text-lg text-text placeholder:text-faint"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="rounded-xl accent-gradient p-2.5 text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft(name);
                }}
                className="rounded-xl border border-border p-2.5 text-muted"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coupled && setEditing(true)}
              className="group inline-flex items-center gap-2"
              disabled={!coupled}
            >
              <span className="font-display text-3xl text-text">{displayName}</span>
              {coupled && <Pencil size={16} className="text-faint opacity-0 transition group-hover:opacity-100" />}
            </button>
          )}

        </div>

        {/* barra de evolução */}
        {state.toNext ? (
          <div className="relative mx-auto mt-4 max-w-xs px-6">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Evolução</span>
              <span className="tabular-nums">{state.toNext.label}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full accent-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress * 100}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-1.5 text-xs text-faint">
              Subam de nível registrando memórias para o bichinho crescer.
            </p>
          </div>
        ) : (
          <div className="relative mx-auto mt-4 max-w-sm rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3 text-center">
            <p className="flex items-center justify-center gap-2 text-lg font-semibold text-accent">
              <motion.span
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconEstrela size={19} filled />
              </motion.span>
              Fase Lendária!
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {displayName} atingiu o nível máximo! Uma criatura única, cheia de história e carinho — reflexo de
              tudo o que vocês construíram juntos.
            </p>
          </div>
        )}
      </div>

      {/* Próxima fase — preview do que está por vir */}
      {nextStage !== null && state.toNext && (
        <div className="scrap-frame scrap-frame-botanical mt-4 rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
            <TrendingUp size={16} className="text-accent" />
            Próxima evolução
          </h3>
          <div className="flex items-start gap-4">
            {/* preview visual */}
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-border bg-surface2/50 text-3xl">
              {STAGE_INFO[nextStage].emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-text">{nextStageName}</p>
              <p className="text-xs text-muted">{STAGE_INFO[nextStage].desc}</p>
              {state.toNext && (
                <p className="mt-1.5 text-xs text-accent">
                  Chega à próxima fase no nível {state.toNext.goal} —{" "}
                  {state.toNext.goal - state.toNext.current === 0
                    ? "quase lá!"
                    : `faltam ${state.toNext.goal - state.toNext.current} nível${state.toNext.goal - state.toNext.current !== 1 ? "s" : ""}`}
                </p>
              )}
              {STAGE_INFO[state.stage].unlocks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STAGE_INFO[state.stage].unlocks.map((b, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ânimo / carência */}
      <div className="scrap-frame scrap-frame-quiet mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        {/* Carinha própria em vez de emoji do sistema: no Windows e no iPhone
            o mesmo 😻 tem desenhos bem diferentes. */}
        <motion.span
          className={cn(
            state.daysSinceActive === 0 ? "text-success" : state.daysSinceActive >= 7 ? "text-danger" : "text-warning"
          )}
          animate={state.daysSinceActive === 0 ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <IconCarinha
            size={30}
            estado={state.daysSinceActive === 0 ? "amado" : state.daysSinceActive >= 7 ? "carente" : "feliz"}
          />
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-text">Ânimo</span>
            <span className="text-xs text-muted">
              {state.daysSinceActive === 0
                ? "alimentado hoje"
                : `${state.daysSinceActive} dia${state.daysSinceActive > 1 ? "s" : ""} sem carinho`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <motion.div
              className={cn(
                "h-full rounded-full",
                state.energy > 0.5 ? "bg-success" : state.energy > 0.2 ? "bg-warning" : "bg-danger"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(6, state.energy * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        <Link
          href="/app/novo"
          className="shrink-0 rounded-xl accent-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          Alimentar
        </Link>
      </div>

      {/* Espécie: o segundo eixo de evolução, pelo comportamento do casal */}
      <div className="scrap-frame scrap-frame-tape mt-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{SPECIES_INFO[state.species].emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
              <Dna size={14} className="text-accent" />
              Espécie: {state.speciesLabel}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{state.speciesWhy}</p>
          </div>
        </div>

        {/* outros caminhos possíveis de evolução */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ALL_SPECIES.map((s) => {
            const active = s === state.species;
            const info = SPECIES_INFO[s];
            return (
              <div
                key={s}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center",
                  active ? "border-accent/40 bg-accent/8" : "border-border bg-surface2/40"
                )}
              >
                <span className={cn("text-lg", !active && "opacity-40 grayscale")}>{info.emoji}</span>
                <span className={cn("text-[10px] font-semibold leading-tight", active ? "text-text" : "text-faint")}>
                  {info.name}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          A espécie muda sozinha, de acordo com o que vocês mais fazem por aqui — não dá para escolher.
        </p>
      </div>

      {/* Guarda-roupa: acessórios desbloqueados e a desbloquear */}
      <h2 className="mb-2.5 mt-6 flex items-center gap-2 text-sm font-semibold text-faint">
        <Sparkles size={15} className="text-accent" /> Acessórios
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs">
          {state.features.length}/{ALL_FEATURES.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ALL_FEATURES.map((f, i) => {
          const got = unlocked.has(f);
          const info = FEATURE_INFO[f];
          // filhote (fase 1) ainda não pode usar acessórios — exibe como bloqueado
          const usable = got && state.stage >= 2;
          return (
            <motion.div
              key={f}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.soft, delay: i * 0.04 }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border p-3 text-center",
                usable ? "border-accent/40 bg-accent/8" : "border-border bg-surface/60"
              )}
            >
              <span className={cn("text-2xl", !usable && "opacity-30 grayscale")}>{info.emoji}</span>
              <span className={cn("text-xs font-semibold", usable ? "text-text" : "text-muted")}>
                {info.name}
              </span>
              <span className="text-[10px] leading-tight text-faint">
                {got && state.stage < 2
                  ? "Disponível a partir da fase Jovem"
                  : got
                    ? "Desbloqueado"
                    : info.how}
              </span>
            </motion.div>
          );
        })}
      </div>

      {!coupled && (
        <p className="mt-6 rounded-2xl border border-accent/25 bg-accent/8 p-4 text-center text-sm text-muted">
          Conecte-se com seu amor para o bichinho de vocês começar a crescer de verdade.
        </p>
      )}
    </div>
  );
}

/**
 * O balão de fala do gatinho.
 *
 * Ele troca de assunto sozinho a cada poucos segundos, e a pessoa pode tocar
 * para ele falar a próxima — é o que faz parecer um bichinho de verdade em vez
 * de um painel de estado. O texto sai de `mascotFalas`, então o que ele diz é
 * sempre a situação real do casal, não frase solta.
 */
/**
 * Revela o texto letra por letra, como se ele estivesse falando na hora.
 *
 * Quem pediu menos movimento recebe a frase inteira de uma vez — o efeito é
 * charme, não informação, então não vale forçar.
 */
function useDigitando(texto: string, reduzido: boolean) {
  const [ate, setAte] = useState(reduzido ? texto.length : 0);

  useEffect(() => {
    if (reduzido) {
      setAte(texto.length);
      return;
    }
    setAte(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setAte(i);
      if (i >= texto.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [texto, reduzido]);

  return { visivel: texto.slice(0, ate), digitando: ate < texto.length };
}

function BalaoDoBichinho({ state, nome }: { state: MascotState; nome: string }) {
  const reduzido = useReducedMotion();
  const falas = useMemo(() => mascotFalas(state, nome), [state, nome]);
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [falas]);

  const fala = falas[i] ?? "";
  const { visivel, digitando } = useDigitando(fala, !!reduzido);

  // Só troca de assunto depois de terminar de falar — senão ele se
  // interrompe no meio da frase.
  useEffect(() => {
    if (falas.length < 2 || digitando) return;
    const t = setTimeout(() => setI((n) => (n + 1) % falas.length), 4200);
    return () => clearTimeout(t);
  }, [falas, digitando, i]);

  return (
    /*
     * A posição fica neste `div` e a animação no botão, de propósito: o
     * framer-motion escreve `transform` inline, o que apagava o
     * `-translate-x-1/2` do Tailwind e jogava o balão para fora da tela no
     * celular. Separando as responsabilidades, os dois convivem.
     */
    <div
      className={cn(
        "absolute z-10",
        // No celular ele fala por cima, centralizado: não sobra largura ao lado
        // do gatinho. A partir de sm o balão vai para o canto, como gibi.
        "left-1/2 top-2 w-[82%] -translate-x-1/2",
        "sm:left-auto sm:right-3 sm:top-7 sm:w-[45%] sm:max-w-[15rem] sm:translate-x-0"
      )}
    >
    <motion.button
      onClick={() => setI((n) => (n + 1) % falas.length)}
      initial={reduzido ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={reduzido ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={spring.bouncy}
      aria-label="Ouvir a próxima fala do bichinho"
      className="focus-ring block w-full cursor-pointer text-left"
      style={{ transformOrigin: "bottom center" }}
    >
      <span className="relative block rounded-2xl rounded-bl-md border border-accent/35 bg-surface px-3.5 py-2.5 shadow-lift">
        <span className="block min-h-[2.6em] text-[13px] leading-relaxed text-text">
          {visivel}
          {digitando && (
            <motion.span
              aria-hidden
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          )}
        </span>

        {/* bico do balão, apontando para baixo na direção do gatinho */}
        <span className="absolute -bottom-[6px] left-5 h-3 w-3 rotate-45 rounded-[2px] border-b border-l border-accent/35 bg-surface sm:left-6" />
      </span>

      {falas.length > 1 && (
        <span className="mt-2 flex justify-center gap-1">
          {falas.map((_, n) => (
            <span
              key={n}
              className={cn("h-1 rounded-full transition-all", n === i ? "w-3.5 bg-accent" : "w-1 bg-border")}
            />
          ))}
        </span>
      )}
    </motion.button>
    </div>
  );
}

/**
 * O "quartinho" do bichinho: parede, chão e decorações que evoluem com a fase.
 *
 * Fase 0 (Novelo)  — o gatinho já vem com a cestinha, então aqui só o cantinho
 * Fase 1-3         — quartinho padrão com janela, quadro e vasinho
 * Fase 4 (Lendário)— acabamento dourado, mais brilho nos detalhes
 */
function Habitat({ stage }: { stage: number }) {
  const isLegendary = stage === 4;
  const isEgg = stage === 0;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* parede */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-11 top-0",
          isEgg && "bg-surface2/25",
          isLegendary && "bg-surface2/30",
          !isEgg && !isLegendary && "bg-surface2/35"
        )}
      />
      {/* chão */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-11 border-t-2",
          isLegendary ? "border-yellow-400/30 bg-surface2/50" : "border-border/60 bg-surface2/60"
        )}
      />

      {/* ninho — só na fase ovo */}
      {isEgg && (
        <svg width="200" height="52" viewBox="0 0 200 52" className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <ellipse cx="100" cy="32" rx="88" ry="16" fill="#C4956A" opacity="0.5" />
          <ellipse cx="100" cy="26" rx="72" ry="12" fill="#D4A574" opacity="0.65" />
          <ellipse cx="100" cy="22" rx="52" ry="8.5" fill="#E8C99B" opacity="0.75" />
          {/* linhas de palha */}
          {[-70, -50, -30, -10, 10, 30, 50, 70].map((x, i) => (
            <line
              key={i}
              x1={100 + x}
              y1={22}
              x2={100 + x + (i % 2 === 0 ? 6 : -4)}
              y2={30 + (i % 3) * 2}
              stroke="#C4956A"
              strokeWidth="1.4"
              opacity="0.35"
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}

      {/* tapetinho embaixo do bichinho */}
      <div
        className={cn(
          "absolute bottom-3 left-1/2 h-6 w-44 -translate-x-1/2 rounded-[50%]",
          isLegendary ? "bg-yellow-400/10" : "bg-accent/12"
        )}
      />

      {/* janelinha */}
      <svg width="52" height="46" viewBox="0 0 52 46" className="absolute left-5 top-6">
        <rect
          x="1"
          y="1"
          width="50"
          height="44"
          rx="10"
          className={cn(isLegendary ? "fill-yellow-400/8" : "fill-accent/10", "stroke-border")}
          strokeWidth="2"
        />
        <line x1="26" y1="1" x2="26" y2="45" className="stroke-border" strokeWidth="2" />
        <line x1="1" y1="23" x2="51" y2="23" className="stroke-border" strokeWidth="2" />
        {isLegendary && (
          <>
            <circle cx="13" cy="12" r="3" className="fill-yellow-400/30" />
            <circle cx="39" cy="34" r="2.5" className="fill-yellow-400/20" />
          </>
        )}
      </svg>

      {/* quadrinho com coração + prateleira */}
      <svg width="70" height="62" viewBox="0 0 70 62" className="absolute right-5 top-5">
        <rect
          x="15"
          y="1"
          width="40"
          height="34"
          rx="6"
          className={cn(isLegendary ? "stroke-yellow-400/50" : "stroke-border")}
          strokeWidth="2"
          fill="none"
          opacity="0.7"
        />
        <text x="35" y="24" fontSize="16" textAnchor="middle" opacity="0.75">
          💗
        </text>
        <rect
          x="0"
          y="52"
          width="70"
          height="5"
          rx="2"
          className={cn(isLegendary ? "fill-yellow-400/30" : "fill-border")}
          opacity="0.6"
        />
        <ellipse cx="16" cy="43" rx="7" ry="9" className="fill-accent2" opacity="0.35" />
        <ellipse cx="33" cy="46" rx="5" ry="6" className="fill-accent" opacity="0.3" />
      </svg>

      {/* vasinho de planta */}
      <svg width="46" height="52" viewBox="0 0 46 52" className="absolute bottom-9 left-6">
        <path d="M6 26 q-8 -14 -4 -24 q12 4 12 16 q6 -12 18 -8 q0 16 -16 18 Z" className="fill-accent2" opacity="0.4" />
        <path
          d="M4 26 L10 50 L30 50 L36 26 Z"
          className={cn(isLegendary ? "fill-yellow-400/30" : "fill-border")}
          opacity="0.55"
        />
      </svg>
    </div>
  );
}
