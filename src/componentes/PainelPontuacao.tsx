"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { IconTrofeu, IconChama, IconCalendario, IconAmpulheta, IconInfinito, IconCoroa } from "./Icones";
import { api } from "@/nucleo/cliente";
import { cn } from "@/nucleo/utilitarios";
import { spring, EASE_OUT } from "@/nucleo/movimento";
import { levelInfo } from "./ExperienciaJogos";

type Jogador = {
  id: string;
  nome: string;
  cor: string;
  avatarUrl: string | null;
  euMesmo: boolean;
  hoje: number;
  semana: number;
  mes: number;
  total: number;
  partidas: number;
  serie: number[];
};

type Placar = { dias: string[]; hoje: string; jogadores: Jogador[] };

type Periodo = "hoje" | "semana" | "mes" | "total";

const PERIODOS: { chave: Periodo; rotulo: string; icone: typeof IconChama }[] = [
  { chave: "hoje", rotulo: "Hoje", icone: IconChama },
  { chave: "semana", rotulo: "Semana", icone: IconCalendario },
  { chave: "mes", rotulo: "Mês", icone: IconAmpulheta },
  { chave: "total", rotulo: "Sempre", icone: IconInfinito },
];

/**
 * O placar que abre a página de jogos.
 *
 * A pontuação vem do servidor, não do navegador: cada ponto ganho virou uma
 * linha no banco, então nada reseta e os dois veem o mesmo placar de qualquer
 * aparelho. Trocar de período só muda o recorte de datas — o histórico
 * completo continua lá atrás.
 */
export function PainelPontuacao({ recarregar }: { recarregar?: number }) {
  const [placar, setPlacar] = useState<Placar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const reduzido = useReducedMotion();

  useEffect(() => {
    let vivo = true;
    api<Placar>("/api/pontuacao")
      .then((r) => vivo && setPlacar(r))
      .catch(() => vivo && setPlacar(null))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [recarregar]);

  const jogadores = useMemo(() => {
    if (!placar) return [];
    return [...placar.jogadores].sort((a, b) => b[periodo] - a[periodo]);
  }, [placar, periodo]);

  const lider = jogadores[0];
  const maiorDoPeriodo = Math.max(1, ...jogadores.map((j) => j[periodo]));

  // O nível do casal vem da soma dos dois: a evolução aqui é de vocês, não uma
  // disputa de quem sobe mais rápido.
  const totalCasal = jogadores.reduce((acc, j) => acc + j.total, 0);
  const nivel = levelInfo(totalCasal);

  if (carregando) {
    return (
      <div className="scrap-frame scrap-frame-quiet mb-6 flex items-center justify-center rounded-3xl border border-border bg-surface py-10">
        <Loader2 size={20} className="animate-spin text-faint" />
      </div>
    );
  }

  if (!placar || jogadores.length === 0) return null;

  const empate = jogadores.length > 1 && jogadores[0][periodo] === jogadores[1][periodo];

  return (
    <section className="scrap-frame scrap-frame-botanical mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/8 via-surface to-accent2/6">
      {/* topo: nível do casal + progresso */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        {/* O troféu respira devagar — presença sem chamar atenção demais. */}
        <motion.span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"
          animate={reduzido ? {} : { scale: [1, 1.07, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <IconTrofeu size={19} />
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl leading-none text-text">Nível {nivel.level}</span>
            <span className="text-xs text-muted">de vocês dois</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
            <motion.div
              className="h-full rounded-full accent-gradient"
              initial={reduzido ? false : { width: 0 }}
              animate={{ width: `${nivel.progress * 100}%` }}
              transition={reduzido ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT }}
            />
          </div>
        </div>
        <span className="shrink-0 text-right text-[11px] leading-tight text-faint">
          {nivel.xpIntoLevel}/{nivel.xpForNextLevel} pts
          <br />
          <span className="tabular-nums">{totalCasal.toLocaleString("pt-BR")} no total</span>
        </span>
      </div>

      {/* seletor de período */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 sm:px-5">
        {PERIODOS.map(({ chave, rotulo, icone: Icone }) => {
          const ativo = periodo === chave;
          return (
            <button
              key={chave}
              onClick={() => setPeriodo(chave)}
              className={cn(
                "flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
                ativo
                  ? "bg-accent text-white shadow-glow"
                  : "border border-border text-muted hover:border-accent/40 hover:text-text"
              )}
            >
              <Icone size={14} />
              {rotulo}
            </button>
          );
        })}
      </div>

      {/* ranking do período */}
      <div className="space-y-2.5 px-4 pb-4 sm:px-5">
        {jogadores.map((j, i) => {
          const valor = j[periodo];
          const naFrente = i === 0 && valor > 0 && !empate;
          return (
            <div key={j.id} className="flex items-center gap-3">
              <span className="relative shrink-0">
                <Avatar name={j.nome} color={j.cor} url={j.avatarUrl} size={38} />
                {naFrente && (
                  <motion.span
                    initial={reduzido ? false : { scale: 0, rotate: -25 }}
                    animate={reduzido ? {} : { scale: 1, rotate: [-8, 8, -8] }}
                    transition={
                      reduzido
                        ? { duration: 0 }
                        : { scale: spring.bouncy, rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                    }
                    className="absolute -right-1.5 -top-1.5 text-warning"
                    title="Na frente"
                  >
                    <IconCoroa size={16} />
                  </motion.span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-sm", j.euMesmo ? "font-bold text-text" : "font-medium text-muted")}>
                    {j.nome}
                    {j.euMesmo && <span className="ml-1 text-[10px] font-normal text-faint">(você)</span>}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-accent">
                    {valor.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
                  <motion.div
                    className={cn("h-full rounded-full", naFrente ? "accent-gradient" : "bg-accent/45")}
                    initial={reduzido ? false : { width: 0 }}
                    animate={{ width: `${(valor / maiorDoPeriodo) * 100}%` }}
                    transition={reduzido ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT, delay: i * 0.08 }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {jogadores.every((j) => j[periodo] === 0) && (
          <p className="pt-1 text-center text-xs text-faint">
            Ninguém pontuou {periodo === "hoje" ? "hoje" : periodo === "semana" ? "essa semana" : "nesse período"} ainda
            — joguem alguma coisa aí embaixo.
          </p>
        )}
      </div>

      {/* evolução dos últimos 30 dias */}
      <Evolucao placar={placar} reduzido={!!reduzido} />
    </section>
  );
}

/**
 * Barras dos últimos 30 dias, com os dois jogadores empilhados no mesmo dia.
 * É o "ver a evolução": dá pra perceber os dias em que vocês jogaram junto e
 * as sequências, coisa que só o número do dia não mostra.
 */
function Evolucao({ placar, reduzido }: { placar: Placar; reduzido: boolean }) {
  const { dias, jogadores } = placar;
  const totaisDia = dias.map((_, i) => jogadores.reduce((acc, j) => acc + (j.serie[i] ?? 0), 0));
  const teto = Math.max(1, ...totaisDia);

  if (totaisDia.every((v) => v === 0)) return null;

  const primeiro = jogadores[0];
  const segundo = jogadores[1];

  return (
    <div className="border-t border-border/70 px-4 pb-4 pt-3 sm:px-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="kicker">Últimos 30 dias</span>
        <div className="flex items-center gap-3 text-[10px] text-faint">
          {[primeiro, segundo].filter(Boolean).map((j, i) => (
            <span key={j!.id} className="flex items-center gap-1">
              <span
                className={cn("inline-block h-2 w-2 rounded-full", i === 0 ? "bg-accent" : "bg-accent2")}
              />
              {j!.nome}
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-14 items-end gap-[3px]">
        {dias.map((dia, i) => {
          const a = primeiro?.serie[i] ?? 0;
          const b = segundo?.serie[i] ?? 0;
          const total = a + b;
          const altura = total === 0 ? 3 : Math.max(6, (total / teto) * 100);
          return (
            <motion.div
              key={dia}
              className="flex flex-1 flex-col-reverse overflow-hidden rounded-sm bg-surface2"
              style={{ height: `${altura}%` }}
              initial={reduzido ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={reduzido ? { duration: 0 } : { duration: 0.4, delay: i * 0.012, ease: EASE_OUT }}
              title={`${dia}: ${total} ponto${total === 1 ? "" : "s"}`}
            >
              {total > 0 && (
                <>
                  <span className="bg-accent" style={{ height: `${(a / total) * 100}%` }} />
                  <span className="bg-accent2" style={{ height: `${(b / total) * 100}%` }} />
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
