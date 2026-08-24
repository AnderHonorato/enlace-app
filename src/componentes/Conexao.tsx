"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Trophy, Link2, Heart, Info, Images, ClipboardList, BookHeart, Settings, Map } from "lucide-react";
import { AiMark } from "./Papelaria";
import { moodOf } from "@/nucleo/humores";
import { fmtDate, daysSince } from "@/nucleo/utilitarios";
import { IconCerto } from "./Icones";
import { MoodChart, type MoodPoint } from "./GraficoHumor";
import { UpcomingDates } from "./ProximasDatas";
import { YearHeatmap } from "./MapaCalorAnual";
import type { Me } from "@/nucleo/usuario-atual";

type Meta = { key: string; emoji: string; title: string; desc: string; current: number; goal: number; done: boolean };
type Insight = { id: string; insight: string; mood: string | null; author: string };

/** Comemora quando uma meta nova é conquistada (guarda o que já foi visto). */
function useCelebrate(metas: Meta[]) {
  const [celebrating, setCelebrating] = useState<Meta | null>(null);

  useEffect(() => {
    const doneKeys = metas.filter((m) => m.done).map((m) => m.key);
    if (doneKeys.length === 0) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem("enlace-metas-vistas") || "[]");
    } catch {}
    const fresh = doneKeys.filter((k) => !seen.includes(k));
    try {
      localStorage.setItem("enlace-metas-vistas", JSON.stringify(doneKeys));
    } catch {}
    if (seen.length > 0 && fresh.length > 0) {
      const meta = metas.find((m) => m.key === fresh[0]) ?? null;
      setCelebrating(meta);
      const t = setTimeout(() => setCelebrating(null), 4200);
      return () => clearTimeout(t);
    }
  }, [metas]);

  return { celebrating, dismiss: () => setCelebrating(null) };
}

function Celebration({ meta, onDone }: { meta: Meta; onDone: () => void }) {
  const bits = Array.from({ length: 26 }, (_, i) => i);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
    >
      {/* confete */}
      {bits.map((i) => {
        const colors = ["#E5679B", "#9575E8", "#F0883E", "#4ABEB0", "#E0A84A"];
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
            animate={{
              opacity: 0,
              y: [0, -160 - (i % 5) * 40, 320],
              x: (i % 2 ? 1 : -1) * (30 + (i % 7) * 34),
              rotate: (i % 2 ? 1 : -1) * 420,
            }}
            transition={{ duration: 2.4, delay: (i % 6) * 0.06, ease: "easeOut" }}
            className="absolute h-3 w-2 rounded-sm"
            style={{ background: colors[i % colors.length] }}
          />
        );
      })}
      <motion.div
        initial={{ scale: 0.7, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="card relative max-w-xs p-7 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="mb-2 text-6xl"
        >
          {meta.emoji}
        </motion.div>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Conquista desbloqueada</div>
        <h3 className="mt-1 font-display text-3xl text-text">{meta.title}</h3>
        <p className="mt-1 text-sm text-muted">{meta.desc}</p>
        <button onClick={onDone} className="mt-5 w-full rounded-xl accent-gradient py-2.5 font-semibold text-white shadow-glow">
          Oba! 🎉
        </button>
      </motion.div>
    </motion.div>
  );
}

export function Connection({
  me,
  level,
  title,
  points,
  into,
  need,
  ratio,
  toNext,
  streak,
  metas,
  insights,
  moodPoints = [],
}: {
  me: Me;
  level: number;
  title: { title: string; emoji: string };
  points: number;
  into: number;
  need: number;
  ratio: number;
  toNext: number;
  streak: number;
  metas: Meta[];
  insights: Insight[];
  moodPoints?: MoodPoint[];
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const done = metas.filter((m) => m.done).length;
  const { celebrating, dismiss } = useCelebrate(metas);

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {celebrating && <Celebration meta={celebrating} onDone={dismiss} />}
      </AnimatePresence>

      <div>
        <div className="kicker mb-1">O relacionamento de vocês</div>
        <h1 className="font-display text-4xl text-text">Nós</h1>
        <p className="mt-1 text-muted">
          {me.couple ? "O nível de apaixonados de vocês cresce a cada gesto." : "Seus pontos crescem a cada memória. Conecte-se para somar com seu amor."}
        </p>
      </div>

      {/* Level hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden p-6"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgb(var(--surface-2))" strokeWidth="12" />
              <motion.circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="url(#lvl)"
                strokeWidth="12"
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C - C * ratio }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id="lvl" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="rgb(var(--accent))" />
                  <stop offset="1" stopColor="rgb(var(--accent-2))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium uppercase tracking-wide text-faint">Nível</span>
              <span className="display-num text-4xl text-text">{level}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-3xl">{title.emoji}</div>
            <div className="font-display text-3xl text-text">{title.title}</div>
            <div className="mt-1 text-sm text-muted">
              <b className="text-accent">{points.toLocaleString("pt-BR")}</b> pontos de conexão
            </div>
            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                <motion.div
                  className="h-full rounded-full accent-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(ratio * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="mt-1.5 text-xs text-faint">
                {into}/{need} · faltam <b className="text-muted">{toNext}</b> pts para o nível {level + 1}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Retrospectiva — destaque estilo Wrapped */}
      <Link href="/app/retrospectiva">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.015 }}
          className="relative overflow-hidden rounded-3xl accent-gradient p-5 text-white shadow-lift"
        >
          <div className="relative flex items-center gap-4">
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-5xl"
            >
              ✨
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                Novidade
              </div>
              <div className="font-display text-2xl leading-tight">A retrospectiva de vocês</div>
              <div className="text-sm text-white/90">
                Os destaques da história de vocês, em tela cheia — e dá pra compartilhar.
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-accentInk">
              Ver ▸
            </span>
          </div>
        </motion.div>
      </Link>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<Flame size={18} />} value={streak} label={streak === 1 ? "dia seguido" : "dias seguidos"} />
        <Tile icon={<Trophy size={18} />} value={`${done}/${metas.length}`} label="metas" />
        <Tile icon={<Heart size={18} className="fill-accent" />} value={points.toLocaleString("pt-BR")} label="pontos" />
      </div>

      {/* Nossa história */}
      {me.couple && (me.couple.howWeMet || me.couple.metDate || me.couple.anniversary) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <BookHeart size={18} />
            </span>
            <h2 className="flex-1 font-display text-2xl text-text">Nossa história</h2>
            <Link href="/app/config" className="text-faint transition hover:text-accent" title="Editar">
              <Settings size={16} />
            </Link>
          </div>
          {me.couple.howWeMet && (
            <p className="prose-amora text-[15px] italic leading-relaxed text-muted">“{me.couple.howWeMet}”</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {me.couple.metDate && (
              <span className="rounded-full bg-surface2 px-3 py-1.5 text-muted">
                👀 Nos conhecemos em <b className="text-text">{fmtDate(me.couple.metDate)}</b> · há{" "}
                {daysSince(me.couple.metDate).toLocaleString("pt-BR")} dias
              </span>
            )}
            {me.couple.anniversary && (
              <span className="rounded-full bg-accent/10 px-3 py-1.5 text-accent">
                💞 Namorando desde <b>{fmtDate(me.couple.anniversary)}</b>
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-3">
        <Shortcut href="/app/album" icon={<Images size={19} />} title="Nosso álbum" sub="todas as fotos" />
        <Shortcut href="/app/planos" icon={<ClipboardList size={19} />} title="Planos" sub="metas · desejos · cápsulas" />
        <Shortcut href="/app/mapa" icon={<Map size={19} />} title="Mapa" sub="lugares de vocês" />
        <Shortcut href="/app/livro" icon={<BookHeart size={19} />} title="Nosso livro" sub="exportar em PDF" />
      </div>

      {!me.partner && (
        <Link href="/app/config" className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/8 p-4 transition hover:bg-accent/12">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Link2 size={18} />
          </span>
          <div className="text-sm">
            <div className="font-semibold text-text">Some pontos com seu amor</div>
            <div className="text-muted">Conecte-se para evoluir o nível de vocês juntos.</div>
          </div>
        </Link>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-display text-2xl text-text">
            <AiMark size={18} className="text-accent" /> A IA reparou
          </h2>
          <div className="space-y-2">
            {insights.map((i, k) => {
              const mood = moodOf(i.mood);
              return (
                <motion.div
                  key={i.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: k * 0.08 }}
                  className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.05] p-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <AiMark size={16} />
                  </span>
                  <p className="min-w-0 text-sm leading-relaxed text-muted">
                    <span className="italic text-accentInk">“{i.insight}”</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                      {mood && <span>{mood.emoji}</span>} sobre uma memória de {i.author}
                    </span>
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Datas especiais com contagem regressiva */}
      <UpcomingDates me={me} />

      {/* Humor ao longo do tempo */}
      <MoodChart points={moodPoints} />

      {/* Mapa de calor do ano */}
      <div className="mt-5">
        <YearHeatmap />
      </div>

      {/* Metas */}
      <div>
        <div className="kicker mb-1.5">Conquistas</div>
        <h2 className="mb-2 font-display text-2xl text-text">Metas</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {metas.map((m, k) => {
            const ratio = Math.min(1, m.current / m.goal);
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: k * 0.04 }}
                className={`rounded-2xl border p-3.5 ${m.done ? "border-accent/40 bg-accent/6" : "border-border bg-surface"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-text">
                      {m.title}
                      {m.done && (
                        <span className="text-accent">
                          <IconCerto size={15} />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{m.desc}</div>
                  </div>
                  {!m.done && <span className="text-xs font-medium text-faint">{Math.min(m.current, m.goal)}/{m.goal}</span>}
                </div>
                {!m.done && (
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full accent-gradient" style={{ width: `${ratio * 100}%` }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border2 bg-surface2 p-3.5 text-xs text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-accent" />
        <p>
          Você ganha pontos ao escrever memórias, comentar, curtir e conversar com os personagens. Quando você
          conecta uma IA, ela lê cada memória e dá um bônus pelo carinho e pela conexão. Os pontos não têm limite —
          quanto mais história, maior o nível de vocês.
        </p>
      </div>
    </div>
  );
}

function Shortcut({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">{icon}</span>
      <div className="min-w-0">
        <div className="truncate font-semibold text-text">{title}</div>
        <div className="truncate text-xs text-muted">{sub}</div>
      </div>
    </Link>
  );
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 p-4 text-center">
      <span className="text-accent">{icon}</span>
      <span className="display-num text-2xl text-text">{value}</span>
      <span className="text-[11px] text-faint">{label}</span>
    </div>
  );
}
