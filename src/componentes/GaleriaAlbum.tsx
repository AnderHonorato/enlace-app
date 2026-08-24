"use client";
import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Images, PenLine } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { openLightbox } from "./VisualizadorMidia";

export type AlbumPhoto = {
  id: string;
  url: string;
  entryId: string;
  title: string | null;
  author: string;
  date: string;
};

export function AlbumGallery({ photos }: { photos: AlbumPhoto[] }) {
  // Agrupa por mês, mantendo a ordem (mais recentes primeiro).
  const groups = useMemo(() => {
    const map = new Map<string, AlbumPhoto[]>();
    for (const p of photos) {
      const key = format(new Date(p.date), "MMMM 'de' yyyy", { locale: ptBR });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [photos]);

  const allUrls = useMemo(() => photos.map((p) => p.url), [photos]);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link href="/app" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="kicker mb-1">Fotos de vocês</div>
          <h1 className="font-display text-3xl text-text">Nosso álbum</h1>
          <p className="text-sm text-muted">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"} da história de vocês
          </p>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <Images size={26} />
          </div>
          <h2 className="font-display text-2xl text-text">Ainda sem fotos</h2>
          <p className="mt-1 max-w-xs text-muted">
            Adicione fotos às memórias. Elas aparecerão aqui e formarão o álbum de vocês.
          </p>
          <Link href="/app/novo" className="mt-5 inline-flex items-center gap-2 rounded-full accent-gradient px-5 py-2.5 font-semibold text-white shadow-glow">
            <PenLine size={16} /> Escrever com foto
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map(([month, items]) => (
            <section key={month}>
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="font-display text-xl capitalize text-accent">{month}</h2>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-faint">{items.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {items.map((p, i) => (
                  <motion.button
                    key={p.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    onClick={() => openLightbox(allUrls, allUrls.indexOf(p.url))}
                    title={p.title || undefined}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.title || ""}
                      loading="lazy"
                      className="h-full w-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-105"
                    />
                    {p.title && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-left text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                        {p.title}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
