"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { CharacterAvatar } from "./AvatarPersonagem";
import { AiMark } from "./Papelaria";
import { characterOf } from "@/nucleo/personagens";

type Latest = { id: string; title: string | null; mood: string | null; authorFirst: string } | null;

// Escolhe um personagem conforme o humor da última memória.
function pickCharacter(mood: string | null): string {
  switch (mood) {
    case "triste":
    case "ansioso":
    case "saudade":
    case "cansado":
      return "lua";
    case "chateado":
      return "nino";
    case "feliz":
    case "radiante":
    case "animado":
      return "sol";
    case "apaixonado":
    case "grato":
      return "cupido";
    case "pensativo":
      return "bel";
    default:
      return "lua";
  }
}

function message(slug: string, title: string): string {
  const t = `“${title}”`;
  switch (slug) {
    case "sol":
      return `${t} parece ter sido especial! Quer me contar? ☀️`;
    case "cupido":
      return `Li sobre ${t} 💘 Quer ideias pra surpreender seu amor?`;
    case "nino":
      return `Vi que você escreveu sobre ${t}. Se quiser conversar, estou aqui. 🦉`;
    case "bel":
      return `${t} me inspirou 🌸 Quer transformar isso em palavras bonitas?`;
    default:
      return `Vi que você escreveu ${t}. Como está seu coração? Quer conversar? 🌙`;
  }
}

export function ProactiveBubble({ latest }: { latest: Latest }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [slug, setSlug] = useState("lua");
  const [title, setTitle] = useState("sua última memória");

  useEffect(() => {
    if (!latest) return;
    const chosen = pickCharacter(latest.mood);
    const t = latest.title || "sua última memória";
    setSlug(chosen);
    setTitle(t);

    let cancelled = false;
    try {
      const dismissedFor = localStorage.getItem("enlace-proactive-entry");
      const lastTs = Number(localStorage.getItem("enlace-proactive-ts") || 0);
      const fresh = Date.now() - lastTs > 4 * 60 * 60 * 1000; // no máx. a cada 4h
      if (dismissedFor === latest.id || !fresh) return;
    } catch {}

    const timer = setTimeout(() => {
      if (!cancelled) {
        setShow(true);
        try {
          localStorage.setItem("enlace-proactive-ts", String(Date.now()));
        } catch {}
      }
    }, 2600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [latest]);

  function remember() {
    if (latest) {
      try {
        localStorage.setItem("enlace-proactive-entry", latest.id);
      } catch {}
    }
  }

  function dismiss() {
    remember();
    setShow(false);
  }

  function open() {
    remember();
    setShow(false);
    const ctx = `Escrevi sobre "${title}" e queria conversar sobre isso.`;
    router.push(`/app/personagens/${slug}?ctx=${encodeURIComponent(ctx)}`);
  }

  const character = characterOf(slug);

  return (
    <AnimatePresence>
      {show && character && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-24 right-4 z-40 w-[17rem] lg:bottom-6 lg:right-6"
        >
          <div className="card relative p-3.5 pr-8 shadow-lift">
            <button
              onClick={dismiss}
              className="absolute right-2 top-2 rounded-lg p-1 text-faint transition hover:bg-surface2 hover:text-text"
              aria-label="Dispensar"
            >
              <X size={15} />
            </button>
            <div className="flex items-start gap-3">
              <motion.div className="relative shrink-0" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <CharacterAvatar slug={slug} size={48} />
                {/* Crachá que marca a fala como IA — nunca deixa confundir com o parceiro. */}
                <span
                  className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-surface bg-accent text-white"
                  title="Personagem de IA"
                >
                  <AiMark size={10} />
                </span>
              </motion.div>
              <div className="min-w-0">
                <div className="text-xs font-semibold" style={{ color: character.accent }}>
                  {character.name}
                </div>
                <p className="mt-0.5 text-sm leading-snug text-text">{message(slug, title)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={open}
                className="flex-1 rounded-lg accent-gradient py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Conversar
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-surface2"
              >
                Agora não
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
