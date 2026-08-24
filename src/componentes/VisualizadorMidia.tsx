"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type State = { images: string[]; index: number };
let listener: ((s: State | null) => void) | null = null;

/** Abre o visualizador de fotos em tela cheia. */
export function openLightbox(images: string[], index = 0) {
  if (!images?.length) return;
  listener?.({ images, index });
}

export function LightboxHost() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    listener = setState;
    return () => {
      listener = null;
    };
  }, []);

  const close = () => setState(null);
  const go = (d: number) =>
    setState((s) => (s ? { ...s, index: (s.index + d + s.images.length) % s.images.length } : s));

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  const multiple = (state?.images.length ?? 0) > 1;

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>

          {multiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                aria-label="Anterior"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                aria-label="Próxima"
              >
                <ChevronRight size={26} />
              </button>
              <div className="absolute bottom-5 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {state.index + 1} / {state.images.length}
              </div>
            </>
          )}

          <motion.img
            key={state.index}
            src={state.images[state.index]}
            alt=""
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88dvh] max-w-[94vw] rounded-lg object-contain shadow-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
