"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/nucleo/cliente";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PenLine, ArrowDownUp, Heart, Link2, Sparkles, Search, Star, X, History, Loader2, ChevronDown } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toPlain } from "@/nucleo/sanitizacao";
import { MOODS } from "@/nucleo/humores";
import { CartaoMemoria } from "./CartaoMemoria";
import { ProactiveBubble } from "./BalaoProativo";
import { DailySummaryCard } from "./CartaoResumoDiario";
import { StreakReminder } from "./LembreteSequencia";
import { WeeklyChallenge } from "./DesafioSemanal";
import { DailyMissions } from "./MissoesDiarias";
import { EventOfDay } from "./EventoDoDia";
import { MascotCard } from "./CartaoMascote";
import { TogetherWidget } from "./ContadorJuntos";
import { DailyQuestion } from "./PerguntaDiaria";
import { BirthdayMode } from "./ModoAniversario";
import { fmtDay, daysSince, cn } from "@/nucleo/utilitarios";
import { fadeUp, listItem, spring } from "@/nucleo/movimento";
import { levelFromPoints, loveTitle } from "@/nucleo/pontos";
import type { EntryDTO } from "@/nucleo/memorias";
import { EstadoVazio } from "./linha-do-tempo/EstadoVazio";
import type { PropriedadesLinhaDoTempo } from "./linha-do-tempo/tipos";
import { filtrarMemorias } from "./linha-do-tempo/filtrar-memorias";

export function LinhaDoTempo({
  initial,
  initialTotal,
  initialNextCursor,
  me,
  summaryToday,
  names,
  streakInfo,
  onThisDay = [],
  challenge,
  challengeDone = false,
  missions = [],
  missionDoneTags = [],
  lastFeedSeenAt = null,
  mascot,
}: PropriedadesLinhaDoTempo) {
  const [entries, setEntries] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [changingOrder, setChangingOrder] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const topIdsRef = useRef(initial.slice(0, 12).map((entry) => entry.id));

  // Uma navegação/refresh do App Router entrega uma nova lista pelo servidor,
  // mas useState preserva o valor da montagem anterior. Sem esta sincronização,
  // a memória era salva e a notificação chegava, porém nem o autor nem o
  // parceiro viam a publicação nova até recarregar a página inteira.
  useEffect(() => {
    setEntries(initial);
    setTotal(initialTotal);
    setNextCursor(initialNextCursor);
    topIdsRef.current = initial.slice(0, 12).map((entry) => entry.id);
  }, [initial, initialNextCursor, initialTotal]);

  // Mantém publicações e comentários do casal atualizados também quando a
  // pessoa deixa o feed aberto. O polling pausa com a aba oculta e um foco na
  // janela força a atualização imediatamente, economizando dados no celular.
  useEffect(() => {
    let alive = true;
    const refreshFeed = () => {
      if (document.visibilityState === "hidden" || order !== "desc") return;
      api<{ entries: EntryDTO[]; total: number }>("/api/entries?limit=12")
        .then((result) => {
          if (!alive) return;
          setTotal(result.total);
          setEntries((current) => {
            const currentById = new Map(current.map((entry) => [entry.id, entry]));
            const previousTop = new Set(topIdsRef.current);
            const freshIds = new Set(result.entries.map((entry) => entry.id));
            const fresh = result.entries.map((entry) => {
              const previous = currentById.get(entry.id);
              return previous && JSON.stringify(previous) === JSON.stringify(entry) ? previous : entry;
            });
            const tail = current.filter((entry) => !freshIds.has(entry.id) && !previousTop.has(entry.id));
            topIdsRef.current = result.entries.map((entry) => entry.id);
            const next = [...fresh, ...tail];
            return next.length === current.length && next.every((entry, index) => entry === current[index]) ? current : next;
          });
        })
        .catch(() => {});
    };
    const interval = window.setInterval(refreshFeed, 20_000);
    window.addEventListener("focus", refreshFeed);
    document.addEventListener("visibilitychange", refreshFeed);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshFeed);
      document.removeEventListener("visibilitychange", refreshFeed);
    };
  }, [order]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await api<{ entries: EntryDTO[]; total: number; nextCursor: string | null }>(
        `/api/entries?limit=12&order=${order}&cursor=${encodeURIComponent(nextCursor)}`
      );
      setEntries((current) => {
        const known = new Set(current.map((entry) => entry.id));
        return [...current, ...result.entries.filter((entry) => !known.has(entry.id))];
      });
      setTotal(result.total);
      setNextCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeOrder() {
    if (changingOrder) return;
    const nextOrder = order === "desc" ? "asc" : "desc";
    setChangingOrder(true);
    try {
      const result = await api<{ entries: EntryDTO[]; total: number; nextCursor: string | null }>(
        `/api/entries?limit=12&order=${nextOrder}`
      );
      setOrder(nextOrder);
      setEntries(result.entries);
      setTotal(result.total);
      setNextCursor(result.nextCursor);
      topIdsRef.current = result.entries.map((entry) => entry.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setChangingOrder(false);
    }
  }

  // Deep link vindo de uma notificação: ?memoria=<id>&comentario=<id>
  const params = useSearchParams();
  const targetEntry = params.get("memoria");
  const targetComment = params.get("comentario");
  const [focusEntry, setFocusEntry] = useState<string | null>(targetEntry);

  useEffect(() => setFocusEntry(targetEntry), [targetEntry]);

  // O realce é temporário: some depois de alguns segundos para não poluir o feed.
  useEffect(() => {
    if (!focusEntry) return;
    const t = setTimeout(() => setFocusEntry(null), 4000);
    return () => clearTimeout(t);
  }, [focusEntry]);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [fMood, setFMood] = useState("");
  const [fTag, setFTag] = useState("");
  const [fFav, setFFav] = useState(false);

  useEffect(() => {
    if (params.get("buscar") === "1") setShowSearch(true);
  }, [params]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) for (const t of e.tags) s.add(t);
    return Array.from(s).sort();
  }, [entries]);

  const filtering = !!(query.trim() || fMood || fTag || fFav);
  const sorted = useMemo(
    () => filtrarMemorias(entries, { consulta: query, humor: fMood, etiqueta: fTag, somenteFavoritas: fFav, ordem: order }),
    [entries, order, query, fMood, fTag, fFav]
  );

  function clearFilters() { setQuery(""); setFMood(""); setFTag(""); setFFav(false); }
  const first = me.name.split(/\s+/)[0];
  // "Dias de história" começa no dia em que o casal se conheceu. O início
  // do namoro continua sendo um marco separado e serve apenas de fallback
  // para casais antigos que ainda não preencheram `metDate`.
  const storyStart = me.couple?.metDate ?? me.couple?.anniversary ?? null;
  const together =
    storyStart != null
      ? daysSince(storyStart)
      : entries.length > 0
      ? daysSince(entries.reduce((min, e) => (e.entryDate < min ? e.entryDate : min), entries[0].entryDate))
      : 0;

  function onDelete(id: string) {
    setEntries((e) => e.filter((x) => x.id !== id));
    setTotal((count) => Math.max(0, count - 1));
  }

  // ── Feed "novo / não visto" ──
  // Uma memória é nova se foi publicada depois da última vez que vi o feed e
  // não é minha. Ao rolar por ela, marca como vista (local) e avança a marca
  // no servidor de forma debounced.
  const watermark = useMemo(() => (lastFeedSeenAt ? new Date(lastFeedSeenAt).getTime() : 0), [lastFeedSeenAt]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const maxSeenAt = useRef(watermark);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const isNew = (e: EntryDTO) =>
    !e.isMine && new Date(e.createdAt).getTime() > watermark && !seenIds.has(e.id);

  const newCount = useMemo(
    () => entries.filter((e) => !e.isMine && new Date(e.createdAt).getTime() > watermark && !seenIds.has(e.id)).length,
    [entries, watermark, seenIds]
  );

  function markSeen(e: EntryDTO) {
    setSeenIds((s) => (s.has(e.id) ? s : new Set(s).add(e.id)));
    const t = new Date(e.createdAt).getTime();
    if (t > maxSeenAt.current) maxSeenAt.current = t;
    // debounce: envia a marca mais recente uma vez, depois que o usuário parou.
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api("/api/feed/seen", {
        method: "POST",
        body: JSON.stringify({ at: new Date(maxSeenAt.current).toISOString() }),
      }).catch(() => {});
    }, 1200);
  }

  // Ao sair da página, garante que a marca foi enviada.
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      if (maxSeenAt.current > watermark) {
        const payload = JSON.stringify({ at: new Date(maxSeenAt.current).toISOString() });
        // sendBeacon sobrevive ao unload; cai para fetch se indisponível.
        if (navigator.sendBeacon) navigator.sendBeacon("/api/feed/seen", payload);
        else api("/api/feed/seen", { method: "POST", body: payload }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const level = me.couple ? me.couple.level : levelFromPoints(me.points);
  const lt = loveTitle(level);

  const latestMine = entries.find((e) => e.isMine) ?? entries[0];
  const latest = latestMine
    ? {
        id: latestMine.id,
        title: latestMine.title,
        mood: latestMine.mood,
        authorFirst: (latestMine.author.displayName || latestMine.author.name).split(/\s+/)[0],
      }
    : null;

  let lastDay = "";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="display text-4xl text-text">
          Olá, <span className="gradient-text">{first}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          {me.couple && me.partner ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-accent">
              <Heart size={13} className="fill-accent" /> {together} dias de história
            </span>
          ) : (
            <Link href="/app/config" className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-accent transition hover:bg-accent/16">
              <Link2 size={13} /> Conecte-se com seu amor
            </Link>
          )}
          <Link
            href="/app/nos"
            className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1 text-muted transition hover:text-accent"
          >
            <Sparkles size={13} className="text-accent" /> Nível {level} · {lt.title}
          </Link>
          <span className="rounded-full bg-surface2 px-3 py-1 text-muted">
            {total} {total === 1 ? "memória" : "memórias"}
          </span>
        </div>
      </div>

      <Link
        href="/app/novo"
        className="scrap-frame scrap-frame-tape group mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 shadow-sm transition hover:border-accent/35 hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Criar uma nova memória"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent transition group-hover:bg-accent group-hover:text-white">
          <PenLine size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">Guarde um momento de hoje</span>
          <span className="block truncate text-xs text-muted">Escreva ou adicione foto, vídeo ou voz</span>
        </span>
        <span className="hidden text-xs font-semibold text-accent sm:block">Nova memória</span>
      </Link>

      <BirthdayMode me={me} photos={entries.flatMap((entry) => entry.attachments.filter((a) => a.type === "image").map((a) => a.url)).slice(0, 6)} />

      {storyStart && <TogetherWidget startDate={storyStart} />}

      {/* Recursos diários continuam disponíveis, mas não empurram os posts por
          várias telas no celular. Um único grupo guarda pergunta, missões,
          bichinho e resumo. */}
      <section className="scrap-frame scrap-frame-quiet mb-5 rounded-2xl border border-border bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => setShowToday((open) => !open)}
          aria-expanded={showToday}
          aria-controls="timeline-today"
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Sparkles size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-text">Hoje no Enlace</span>
            <span className="block truncate text-xs text-muted">Pergunta, missões, bichinho e resumo do dia</span>
          </span>
          <motion.span animate={{ rotate: showToday ? 180 : 0 }} className="text-faint">
            <ChevronDown size={17} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {showToday && (
            <motion.div
              id="timeline-today"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-border p-3 sm:p-4">
                {streakInfo && <StreakReminder info={streakInfo} />}
                {mascot && <MascotCard state={mascot.state} name={mascot.name} />}
                <DailyQuestion />
                {challenge && <WeeklyChallenge challenge={challenge} done={challengeDone} />}
                {me.couple && me.partner && <EventOfDay />}
                {missions.length > 0 && <DailyMissions missions={missions} doneTags={missionDoneTags} />}
                <DailySummaryCard
                  initialToday={summaryToday ?? null}
                  coupled={!!me.couple}
                  names={names || me.displayName || me.name}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Neste dia, há X anos */}
      {onThisDay.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="scrap-frame scrap-frame-botanical mb-5 rounded-3xl border border-warning/30 bg-warning/8 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
            <History size={16} /> Neste dia…
          </div>
          {onThisDay.map((e) => {
            const years = new Date().getFullYear() - new Date(e.entryDate).getFullYear();
            return (
              <div key={e.id} className="mt-1.5 text-sm text-muted">
                <b className="text-text">
                  há {years} {years === 1 ? "ano" : "anos"}
                </b>
                , {e.author.displayName || e.author.name} escreveu{" "}
                <i className="text-text">“{e.title || toPlain(e.content).slice(0, 60)}”</i>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Pílula de novidades — some conforme você rola pelas novas */}
      <AnimatePresence>
        {newCount > 0 && !filtering && (
          <motion.button
            key="new-pill"
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={spring.snappy}
            onClick={() => {
              // rola até a primeira memória nova
              const first = sorted.find((e) => isNew(e));
              if (first) document.getElementById(`entry-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="sticky top-3 z-20 mx-auto mb-4 flex w-fit items-center gap-2 rounded-full accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-white"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            {newCount} {newCount === 1 ? "nova memória" : "novas memórias"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      {entries.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="kicker">Linha do tempo</span>
            <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center">
              <button
                onClick={() => setShowSearch((s) => !s)}
                className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  showSearch || filtering ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:bg-surface2"
                }`}
              >
                <Search size={13} /> Buscar
              </button>
              <button
                onClick={changeOrder}
                disabled={changingOrder}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-surface2"
              >
                {changingOrder ? <Loader2 size={13} className="animate-spin" /> : <ArrowDownUp size={13} />}
                {order === "desc" ? "Mais recentes" : "Mais antigas"}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2.5 rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="shrink-0 text-faint" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por texto, lugar, tag…"
                      className="flex-1 bg-transparent text-sm text-text placeholder:text-faint focus:outline-none"
                      autoFocus
                    />
                    {filtering && (
                      <button onClick={clearFilters} className="text-faint transition hover:text-danger" title="Limpar filtros">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setFFav((f) => !f)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        fFav ? "border-warning bg-warning/10 text-warning" : "border-border text-muted hover:bg-surface2"
                      }`}
                    >
                      <Star size={11} className={fFav ? "fill-warning" : ""} /> Especiais
                    </button>
                    <select
                      value={fMood}
                      onChange={(e) => setFMood(e.target.value)}
                      className="rounded-full border border-border bg-bg2 px-2.5 py-1 text-xs text-muted focus:outline-none"
                    >
                      <option value="">Humor: todos</option>
                      {MOODS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.emoji} {m.label}
                        </option>
                      ))}
                    </select>
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setFTag((cur) => (cur === t ? "" : t))}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          fTag === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:bg-surface2"
                        }`}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                  {filtering && (
                    <p className="text-xs text-faint">
                      {sorted.length} {sorted.length === 1 ? "memória encontrada" : "memórias encontradas"}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {filtering && entries.length < total && (
            <p className="mt-2 text-[11px] text-faint">
              A busca considera {entries.length} de {total} memórias carregadas.
            </p>
          )}
        </div>
      )}

      {/* Empty */}
      {entries.length === 0 ? (
        <EstadoVazio casalConectado={!!me.partner} />
      ) : sorted.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <Search size={26} className="mb-2 text-faint" />
          <p className="display text-2xl text-text">Nada por aqui</p>
          <p className="mt-1 text-sm text-muted">Nenhuma memória combina com esses filtros.</p>
          <button onClick={clearFilters} className="mt-4 rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:bg-surface2">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="relative">
          <AnimatePresence mode="popLayout">
            {sorted.map((entry, idx) => {
              const day = fmtDay(entry.entryDate);
              const showDay = day !== lastDay;
              lastDay = day;
              const d = new Date(entry.entryDate);
              const weekdayLabel = isToday(d) ? "Hoje" : isYesterday(d) ? "Ontem" : format(d, "EEE", { locale: ptBR });
              const dayMonthLabel = format(d, "d MMM", { locale: ptBR });
              const recent = isToday(d);
              const riseDelay = idx === 0 ? "" : idx === 1 ? "delay-1" : idx === 2 ? "delay-2" : "delay-3";
              return (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className={cn("flex", idx === 0 ? "mt-0" : showDay ? "mt-6" : "mt-5")}
                >
                  {/* Gutter de data — 74px, alinhado à direita (só desktop) */}
                  <div
                    className={cn(
                      "hidden w-[74px] shrink-0 flex-col items-end pr-0 pt-1 sm:flex",
                      !showDay && "invisible"
                    )}
                  >
                    <span className="display whitespace-nowrap text-[19px] capitalize leading-none text-text">
                      {weekdayLabel}
                    </span>
                    <span className="kicker-sm mt-1.5 whitespace-nowrap text-faint">{dayMonthLabel}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* "Ontem ——————" — só no mobile, uma vez por dia */}
                    {showDay && (
                      <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mb-3 flex items-center gap-3 sm:hidden"
                      >
                        <span className="display whitespace-nowrap text-lg capitalize text-text">{weekdayLabel}</span>
                        <span className="rule rule-grow flex-1" />
                      </motion.div>
                    )}
                    <div className={cn("relative border-l border-border2 pl-[26px] anim-rise", riseDelay)}>
                      <span
                        aria-hidden
                        className={cn("timeline-dot absolute left-[-30.5px] top-[34px]", recent && "timeline-dot-on")}
                      />
                      <CartaoMemoria
                        entry={entry}
                        me={me}
                        onDelete={onDelete}
                        highlight={focusEntry === entry.id}
                        openComments={targetEntry === entry.id && !!targetComment}
                        highlightCommentId={targetEntry === entry.id ? targetComment : null}
                        isNew={isNew(entry)}
                        onSeen={() => markSeen(entry)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {nextCursor && entries.length > 0 && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto mt-6 flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/40 hover:bg-surface2 hover:text-accent disabled:opacity-60"
        >
          {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
          {loadingMore ? "Carregando…" : `Ver mais memórias · ${entries.length} de ${total}`}
        </button>
      )}

      <ProactiveBubble latest={latest} />
    </div>
  );
}
