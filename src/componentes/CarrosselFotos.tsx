"use client";
import { useRef, useState } from "react";
import { cn } from "@/nucleo/utilitarios";

type Photo = { url: string; caption?: string | null };

/** Carrossel de fotos com scroll-snap, bolinhas e legenda. */
export function PhotoCarousel({ photos, onOpen }: { photos: Photo[]; onOpen?: (i: number) => void }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  if (photos.length === 1) {
    const p = photos[0];
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <button type="button" onClick={() => onOpen?.(0)} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={p.caption || ""}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] max-h-[420px] w-full cursor-zoom-in object-cover sm:aspect-[16/10]"
          />
        </button>
        {p.caption && <div className="bg-surface2/60 px-3 py-1.5 text-sm text-muted">{p.caption}</div>}
      </div>
    );
  }

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }
  function goTo(i: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="relative">
        <div
          ref={ref}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpen?.(i)}
              className="w-full shrink-0 snap-center"
              style={{ flexBasis: "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || ""}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] max-h-[420px] w-full cursor-zoom-in object-cover sm:aspect-[16/10]"
              />
            </button>
          ))}
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
          {active + 1}/{photos.length}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              className={cn(
                "pointer-events-auto h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
      {photos[active]?.caption && (
        <div className="bg-surface2/60 px-3 py-1.5 text-sm text-muted">{photos[active].caption}</div>
      )}
    </div>
  );
}
