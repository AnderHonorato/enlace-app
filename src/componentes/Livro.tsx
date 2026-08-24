"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Printer, BookHeart, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { HeartMark } from "./Logo";
import { moodOf } from "@/nucleo/humores";
import { fmtDate, cn } from "@/nucleo/utilitarios";
import { IconLugar, IconCoracao } from "./Icones";
import { looksLikeHtml } from "@/nucleo/sanitizacao";
import type { EntryDTO } from "@/nucleo/memorias";

export function Livro({
  entries,
  names,
  howWeMet,
  anniversary,
}: {
  entries: EntryDTO[];
  names: string;
  howWeMet: string | null;
  anniversary: string | null;
}) {
  const [modoLivro, setModoLivro] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [virando, setVirando] = useState<"frente" | "tras" | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const img = localStorage.getItem("enlace-bg-image");
      if (img) setBgImage(img);
    } catch {}
  }, []);

  const paginas = entries.filter((e) => !e.locked);
  const total = paginas.length;
  const atual = paginas[pagina];

  function virar(direcao: 1 | -1) {
    if (virando) return;
    const prox = pagina + direcao;
    if (prox < 0 || prox >= total) return;
    setVirando(direcao === 1 ? "frente" : "tras");
    setTimeout(() => {
      setPagina(prox);
      setVirando(null);
    }, 350);
  }

  return (
    <div>
      {/* Barra */}
      <div className="print-hide mb-6 flex flex-wrap items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="kicker mb-1">A história de vocês</div>
          <h1 className="font-display text-3xl text-text">Nosso livro</h1>
          <p className="text-sm text-muted">
            {modoLivro ? "Folheie as páginas como um livro de verdade." : "Pronto para virar PDF ou papel."}
          </p>
        </div>
        <button
          onClick={() => setModoLivro(!modoLivro)}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text transition hover:bg-surface2"
        >
          <BookOpen size={16} />
          {modoLivro ? "Modo impressão" : "Modo livro"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex shrink-0 items-center gap-2 rounded-full accent-gradient px-5 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          <Printer size={17} /> Salvar em PDF
        </button>
      </div>

      {/* Modo impressão (original) */}
      {!modoLivro && (
        <div className="print-area">
          {bgImage && (
            <style>{`@media print{body{position:relative}body::after{content:"";position:fixed;inset:0;background:url(${bgImage}) center/contain no-repeat;opacity:0.35;z-index:-1;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.print-area .card,.print-area .bg-surface,.print-area .book-cover{background:rgba(255,255,255,0.82)!important}}`}</style>
          )}
          <section className="scrap-frame scrap-frame-botanical book-cover relative mb-8 flex flex-col items-center overflow-hidden rounded-3xl border-2 border-border/50 bg-surface px-8 py-20 text-center shadow-2xl">
            {/* Ornamento de canto */}
            <div className="absolute left-6 top-6 h-12 w-12 rounded-tl-2xl border-l-2 border-t-2 border-accent/30" />
            <div className="absolute right-6 top-6 h-12 w-12 rounded-tr-2xl border-r-2 border-t-2 border-accent/30" />
            <div className="absolute bottom-6 left-6 h-12 w-12 rounded-bl-2xl border-b-2 border-l-2 border-accent/30" />
            <div className="absolute bottom-6 right-6 h-12 w-12 rounded-br-2xl border-b-2 border-r-2 border-accent/30" />

            <HeartMark size={56} />
            <h2 className="mt-6 font-display text-5xl leading-tight text-text">{names}</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-px w-8 bg-accent/40" />
              <p className="text-base italic text-muted">O diário da nossa história</p>
              <span className="h-px w-8 bg-accent/40" />
            </div>
            {anniversary && (
              <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-5 py-2 text-sm font-medium text-accent">
                💞 Juntos desde {fmtDate(anniversary)}
              </p>
            )}
            {howWeMet && (
              <div className="mt-10 max-w-md">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Como nos conhecemos</span>
                <p className="mt-2 text-[15px] italic leading-relaxed text-muted">
                  "{howWeMet}"
                </p>
              </div>
            )}
          </section>

          {entries.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <BookHeart size={28} className="mb-2 text-accent" />
              <p className="text-muted">Escrevam memórias e este livro se escreve sozinho.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((e) => (
                <EntryPage key={e.id} entry={e} />
              ))}
            </div>
          )}

          <section className="scrap-frame scrap-frame-botanical relative mt-8 flex flex-col items-center overflow-hidden rounded-3xl border-2 border-border/50 bg-surface px-8 py-14 text-center shadow-lg">
            <div className="absolute left-3 top-3 h-8 w-8 rounded-tl-xl border-l border-t border-accent/20" />
            <div className="absolute right-3 top-3 h-8 w-8 rounded-tr-xl border-r border-t border-accent/20" />
            <HeartMark size={36} />
            <p className="mt-4 font-display text-2xl text-text">…e a história continua.</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-faint">
            Feito com
            <span className="text-accent">
              <IconCoracao size={14} />
            </span>
            no Enlace
          </p>
          </section>
        </div>
      )}

      {/* Modo livro interativo (flip book) */}
      {modoLivro && (
        <div className="print-hide">
          {paginas.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <BookHeart size={28} className="mb-2 text-accent" />
              <p className="text-muted">Escrevam memórias e este livro se escreve sozinho.</p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              {/* Estrutura do livro */}
              <div className="relative rounded-2xl border-2 border-border bg-surface shadow-2xl overflow-hidden"
                style={{ boxShadow: "8px 8px 24px rgba(0,0,0,0.4), -2px 0 12px rgba(0,0,0,0.2)" }}>

                {/* Sombra da lombada */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />

                {/* Sombra da dobra da página */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/10 to-transparent z-10 pointer-events-none" />

                {/* Conteúdo da página */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pagina}
                    initial={virando === "frente" ? { x: 60, opacity: 0, rotateY: -15 } : virando === "tras" ? { x: -60, opacity: 0, rotateY: 15 } : {}}
                    animate={{ x: 0, opacity: 1, rotateY: 0 }}
                    exit={virando === "frente" ? { x: -60, opacity: 0, rotateY: 15 } : virando === "tras" ? { x: 60, opacity: 0, rotateY: -15 } : {}}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformStyle: "preserve-3d", perspective: 1200 }}
                  >
                    <EntryPage entry={atual} />
                  </motion.div>
                </AnimatePresence>

                {/* Page number */}
                <div className="border-t border-border px-6 py-3 text-center text-xs text-faint">
                  Página {pagina + 1} de {total}
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => virar(-1)}
                  disabled={pagina === 0 || !!virando}
                  className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-text transition hover:bg-surface2 disabled:opacity-30"
                >
                  <ChevronLeft size={18} /> Anterior
                </button>
                <span className="text-sm text-muted">
                  {pagina + 1} / {total}
                </span>
                <button
                  onClick={() => virar(1)}
                  disabled={pagina === total - 1 || !!virando}
                  className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-text transition hover:bg-surface2 disabled:opacity-30"
                >
                  Próxima <ChevronRight size={18} />
                </button>
              </div>

              {/* Quick jump */}
              <div className="mt-4 flex justify-center gap-1">
                {paginas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { if (!virando) setPagina(i); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === pagina ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntryPage({ entry }: { entry: EntryDTO }) {
  const mood = moodOf(entry.mood);
  const photos = entry.attachments.filter((a) => a.type === "image");
  return (
    <article className="p-6 sm:p-8 print-area-entry">
      {/* Cabeçalho */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 pb-3">
        <span className="font-display text-sm font-semibold capitalize text-accent">{fmtDate(entry.entryDate)}</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span className="text-xs text-muted">{entry.author.displayName || entry.author.name}</span>
        {mood && (
          <>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs font-medium" style={{ color: mood.color }}>
              {mood.emoji} {mood.label}
            </span>
          </>
        )}
        {entry.place && (
          <>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="inline-flex items-center gap-1 text-xs text-faint">
              <IconLugar size={12} /> {entry.place}
            </span>
          </>
        )}
      </div>

      {/* Título */}
      {entry.title && (
        <h3 className="mb-4 font-display text-2xl leading-snug text-text">{entry.title}</h3>
      )}

      {/* Conteúdo */}
      {entry.content &&
        (looksLikeHtml(entry.content) ? (
          <div className="rich mb-5 text-[15px] leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: entry.content }} />
        ) : (
          <p className="mb-5 text-[15px] leading-relaxed text-muted whitespace-pre-line">{entry.content}</p>
        ))}

      {/* Fotos com moldura */}
      {photos.length > 0 && (
        <div className={cn("mt-2 gap-3", photos.length === 1 ? "flex justify-center" : "grid grid-cols-2")}>
          {photos.map((a, i) => (
            <div key={a.id} className="relative group/pic">
              {/* Moldura decorativa */}
              <div className="rounded-2xl border-2 border-border/40 bg-surface2 p-2 shadow-sm">
                <div className="overflow-hidden rounded-xl border border-border/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={`Foto ${i + 1} de ${entry.title || fmtDate(entry.entryDate)}`}
                    className="w-full object-cover"
                    style={{ maxHeight: photos.length === 1 ? 400 : 240 }}
                    loading="lazy"
                  />
                </div>
                {/* Legenda sutil */}
                <div className="mt-1.5 flex items-center gap-1.5 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                  <span className="text-[10px] text-faint">
                    {entry.title || fmtDate(entry.entryDate)} · foto {i + 1}/{photos.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comentários */}
      {entry.comments.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-border/40 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Comentários</span>
          {entry.comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface2 px-3.5 py-2.5">
              <p className="text-sm text-muted">
                <b className="text-text/80">{c.author.displayName || c.author.name}:</b>{" "}
                <span className="italic">{c.content}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Separador decorativo entre entradas */}
      <div className="mt-6 flex items-center gap-2 print-only-sep">
        <span className="h-px flex-1 bg-border/50" />
        <HeartMark size={12} />
        <span className="h-px flex-1 bg-border/50" />
      </div>
    </article>
  );
}
