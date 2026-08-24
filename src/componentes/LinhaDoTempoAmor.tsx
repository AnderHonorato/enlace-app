"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Sparkles, ChevronDown, ChevronUp, Loader2, ImageIcon } from "lucide-react";
import { cn, fmtDate } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";
import { api } from "@/nucleo/cliente";
import { moodOf } from "@/nucleo/humores";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  emoji: string;
  mood?: string;
  place?: string;
  photos: string[];
  highlight?: boolean;
}

export function LoveTimeline() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ entries: any[] }>("/api/entries?order=asc")
      .then((r) => {
        const mapped: TimelineEvent[] = (r.entries || [])
          .filter((e: any) => !e.locked)
          .map((e: any) => {
            const mood = e.mood ? moodOf(e.mood) : null;
            const photos = (e.attachments || [])
              .filter((a: any) => a.type === "image")
              .map((a: any) => a.url);
            const plainText = stripHtml(e.content || "");
            const snippet = plainText.length > 200 ? plainText.slice(0, 200) + "..." : plainText;

            return {
              date: fmtDate(e.entryDate),
              title: e.title || "Momento especial",
              description: snippet || "Um momento guardado no coração.",
              emoji: mood?.emoji || "💜",
              mood: e.mood,
              place: e.place || undefined,
              photos,
              highlight: photos.length > 0 || !!e.place,
            };
          });
        // Se não tem nenhuma entrada, usa dados demo
        if (mapped.length === 0) {
          setEvents(DEMO_EVENTS);
        } else {
          setEvents(mapped);
        }
        setLoading(false);
      })
      .catch(() => {
        setEvents(DEMO_EVENTS);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  /*
   * O galho é desenhado em pixels reais (viewBox = altura medida), então nada
   * estica: as folhas e as flores mantêm o formato por mais longa que a
   * timeline fique. Por isso precisamos medir a coluna — e remedir quando um
   * card abre, fecha ou a janela muda de tamanho.
   */
  const trilhaRef = useRef<HTMLDivElement>(null);
  const [alturaTrilha, setAlturaTrilha] = useState(0);

  useEffect(() => {
    const el = trilhaRef.current;
    if (!el) return;
    const medir = () => setAlturaTrilha(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-16 text-center">
        <Heart size={40} className="mx-auto text-warning/40" />
        <p className="mt-4 text-muted">Escrevam memórias juntos para ver a timeline de vocês.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="font-display text-3xl text-text">
          Nossa <span className="text-warning">Timeline</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          {events.length} momentos que nos trouxeram até aqui
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div ref={trilhaRef} className="relative">
          {/* O galho florido que desce serpenteando no lugar da linha reta */}
          <Ramo altura={alturaTrilha} />

          <div className="space-y-0">
            {events.map((event, i) => {
              const isLeft = i % 2 === 0;
              const isExpanded = expandedIndex === i;

              return (
                <div key={i} className="relative pb-6">
                  <div className="absolute left-6 top-6 z-10 -translate-x-1/2 md:left-1/2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring.bouncy, delay: i * 0.05 }}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg",
                        event.highlight
                          ? "border-warning bg-warning/20"
                          : "border-accent/40 bg-accent/10"
                      )}
                    >
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        event.highlight ? "bg-warning" : "bg-accent/60"
                      )} />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={cn(
                      "ml-16 md:ml-0",
                      "md:w-[calc(50%-2rem)]",
                      isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"
                    )}
                  >
                    <div
                      className={cn(
                        "cursor-pointer rounded-2xl border bg-surface p-5 transition-all duration-200",
                        event.highlight ? "border-warning/30" : "border-border",
                        isExpanded && "border-warning/50 bg-surface2",
                        event.highlight && isExpanded && "shadow-lift"
                      )}
                      onClick={() => toggleExpand(i)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            <span className="text-xs font-medium uppercase tracking-wide text-warning">{event.date}</span>
                          </div>
                          <h3 className="mt-1.5 font-display text-lg text-text">{event.title}</h3>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                {event.description && (
                                  <p className="mt-3 text-sm leading-relaxed text-muted">{event.description}</p>
                                )}

                                {/* Fotos */}
                                {event.photos.length > 0 && (
                                  <div className={cn("mt-4 gap-2", event.photos.length === 1 ? "flex justify-center" : "grid grid-cols-2")}>
                                    {event.photos.slice(0, 4).map((url, pi) => (
                                      <div key={pi} className="overflow-hidden rounded-xl border border-border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} loading="lazy" />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {(event.place || event.mood) && (
                                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                                    {event.place && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={12} className="text-warning" /> {event.place}
                                      </span>
                                    )}
                                    {event.mood && (
                                      <span className="flex items-center gap-1">
                                        <Sparkles size={12} className="text-warning" /> {event.mood}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Indicador de fotos no card fechado */}
                          {!isExpanded && event.photos.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-faint">
                              <ImageIcon size={10} /> {event.photos.length} foto{event.photos.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        <button className="mt-1 shrink-0 rounded-full p-1 text-faint transition hover:text-warning">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.bouncy, delay: 0.8 }}
            className="relative mt-2 flex justify-center"
          >
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" className="text-accent">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
              </svg>
              <span className="text-xs text-faint">Eternamente</span>
              <svg width="24" height="24" viewBox="0 0 24 24" className="text-warning">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── O galho florido ─────────────────────────────────────────────────────── */

const RAMO_LARGURA = 88; // faixa em que o galho serpenteia (com folga p/ as folhas)
const RAMO_MEIO = RAMO_LARGURA / 2;
const RAMO_AMPLITUDE = 21; // o quanto ele desvia para cada lado
const RAMO_PASSO = 150; // altura de cada curva

/**
 * Monta o caminho do galho: uma sequência de curvas cúbicas que alternam de
 * lado, formando um serpenteado contínuo de cima até embaixo.
 *
 * Devolve também o ponto mais afastado de cada curva (onde nascem as folhas e
 * as flores). Para uma cúbica com os dois controles no mesmo lado, o ponto em
 * t=0.5 cai exatamente em `meio + 0.75 * amplitude * lado`, na metade da
 * altura do trecho — dá para calcular sem precisar do DOM.
 */
function montarRamo(altura: number) {
  const d: string[] = [`M ${RAMO_MEIO} 0`];
  const brotos: { x: number; y: number; lado: number; i: number }[] = [];

  let y = 0;
  let lado = 1;
  let i = 0;

  while (y < altura) {
    const fim = Math.min(y + RAMO_PASSO, altura);
    const trecho = fim - y;
    const cx = RAMO_MEIO + RAMO_AMPLITUDE * lado;
    d.push(`C ${cx} ${y + trecho * 0.35}, ${cx} ${y + trecho * 0.65}, ${RAMO_MEIO} ${fim}`);

    // só ganha broto quando a curva tem altura suficiente para caber
    if (trecho > 60) {
      brotos.push({ x: RAMO_MEIO + 0.75 * RAMO_AMPLITUDE * lado, y: y + trecho / 2, lado, i });
    }

    y = fim;
    lado *= -1;
    i++;
  }

  return { d: d.join(" "), brotos };
}

function Ramo({ altura }: { altura: number }) {
  if (altura < 40) return null;
  const { d, brotos } = montarRamo(altura);

  return (
    <svg
      width={RAMO_LARGURA}
      height={altura}
      viewBox={`0 0 ${RAMO_LARGURA} ${altura}`}
      className="pointer-events-none absolute left-6 top-0 -translate-x-1/2 md:left-1/2"
      aria-hidden
    >
      {/* sombra do galho, para ele não ficar chapado no fundo escuro */}
      <path d={d} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />

      {/* o galho, que "cresce" de cima para baixo ao abrir a página */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#ramo-casca)"
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />

      <defs>
        <linearGradient id="ramo-casca" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B6B3D" />
          <stop offset="0.5" stopColor="#6E5430" />
          <stop offset="1" stopColor="#4E3C22" />
        </linearGradient>
      </defs>

      {brotos.map((b) => (
        <Broto key={b.i} {...b} />
      ))}
    </svg>
  );
}

/** Um par de folhas e, a cada dois brotos, uma florzinha. */
function Broto({ x, y, lado, i }: { x: number; y: number; lado: number; i: number }) {
  const temFlor = i % 2 === 0;
  const atraso = 0.5 + i * 0.11;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: atraso, type: "spring", stiffness: 220, damping: 18 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* folhinha externa */}
      <path
        d={`M ${x} ${y} q ${9 * lado} -7 ${17 * lado} -2 q ${-8 * lado} 8 ${-17 * lado} 2 Z`}
        fill="#4E7A3C"
        opacity="0.85"
      />
      <path
        d={`M ${x} ${y} q ${9 * lado} -7 ${17 * lado} -2`}
        fill="none"
        stroke="#3B5E2C"
        strokeWidth="0.8"
      />
      {/* folhinha interna, apontando para baixo */}
      <path
        d={`M ${x} ${y + 2} q ${7 * lado} 7 ${13 * lado} 3 q ${-6 * lado} -7 ${-13 * lado} -3 Z`}
        fill="#5E8F49"
        opacity="0.7"
      />

      {temFlor && (
        <g transform={`translate(${x + 15 * lado}, ${y - 6})`}>
          {Array.from({ length: 5 }).map((_, p) => {
            const a = (p * 2 * Math.PI) / 5 - Math.PI / 2;
            return (
              <ellipse
                key={p}
                cx={Math.cos(a) * 3.6}
                cy={Math.sin(a) * 3.6}
                rx="3.1"
                ry="3.6"
                fill={i % 4 === 0 ? "#E5679B" : "#F4A0C0"}
                transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 3.6} ${Math.sin(a) * 3.6})`}
                opacity="0.92"
              />
            );
          })}
          <circle cx="0" cy="0" r="2.2" fill="#D4AF37" />
        </g>
      )}
    </motion.g>
  );
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "").trim();
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

const DEMO_EVENTS: TimelineEvent[] = [
  { date: "Primeiro Encontro", title: "O início de tudo", description: "O momento em que nossas vidas se cruzaram e nada mais foi igual.", emoji: "", photos: [], highlight: true },
  { date: "Primeiro Beijo", title: "Magia no ar", description: "Aquele beijo que fez o mundo parar por um instante.", emoji: "", photos: [], highlight: true },
  { date: "Pedido de Namoro", title: "O sim mais feliz", description: "O momento que selou nosso compromisso de amor.", emoji: "", photos: [], highlight: true },
  { date: "Hoje", title: "Escrevendo nossa história", description: "Cada dia uma página nova neste diário de amor.", emoji: "", photos: [], highlight: true },
];
