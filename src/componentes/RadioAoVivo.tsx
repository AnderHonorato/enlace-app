"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, Play, Square, Volume2, ChevronDown } from "lucide-react";
import { IconRadio } from "./Icones";
import { api } from "@/nucleo/cliente";
import { cn } from "@/nucleo/utilitarios";
import { spring } from "@/nucleo/movimento";

type Estacao = { id: string; nome: string; stream: string; logo: string | null; tags: string[]; pais: string };
type Canal = { chave: string; rotulo: string };

/**
 * Rádio ao vivo, de graça, para tocar de fundo.
 *
 * É opcional de propósito: fica recolhido e só toca quando a pessoa escolhe
 * uma estação. Um diário de casal que começa a tocar som sozinho ao abrir
 * seria constrangedor no ônibus.
 */
export function RadioAoVivo() {
  const reduzido = useReducedMotion();
  const [aberto, setAberto] = useState(false);
  const [canal, setCanal] = useState("brasil");
  const [canais, setCanais] = useState<Canal[]>([]);
  const [estacoes, setEstacoes] = useState<Estacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tocando, setTocando] = useState<Estacao | null>(null);
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Só busca a lista quando a pessoa abre a seção — sem gasto para quem nem
  // quer ouvir rádio.
  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    setCarregando(true);
    setErro(null);
    api<{ canais: Canal[]; estacoes: Estacao[] }>(`/api/radio-ao-vivo?canal=${canal}`)
      .then((r) => {
        if (!vivo) return;
        setCanais(r.canais);
        setEstacoes(r.estacoes);
      })
      .catch(() => vivo && setErro("Não foi possível carregar as estações agora."))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [aberto, canal]);

  // Se a página fechar com rádio tocando, o áudio tem que parar junto.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function tocar(e: Estacao) {
    const a = audioRef.current;
    if (!a) return;

    if (tocando?.id === e.id) {
      a.pause();
      setTocando(null);
      return;
    }

    setErro(null);
    setConectando(true);
    a.src = e.stream;
    a.play()
      .then(() => {
        setTocando(e);
        setConectando(false);
      })
      .catch(() => {
        setConectando(false);
        setTocando(null);
        setErro(`${e.nome} não quis tocar. Tente outra estação.`);
      });
  }

  return (
    <section className="scrap-frame scrap-frame-botanical mb-6 overflow-hidden rounded-3xl border border-border bg-surface">
      <button
        onClick={() => setAberto((o) => !o)}
        className="focus-ring flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <motion.span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"
          animate={tocando && !reduzido ? { scale: [1, 1.09, 1] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <IconRadio size={19} />
        </motion.span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">Rádio ao vivo</span>
          <span className="block truncate text-xs text-muted">
            {tocando ? `Tocando: ${tocando.nome}` : "Estações abertas para ouvir de fundo — se quiserem"}
          </span>
        </span>

        {tocando && <BarrinhasNoAr reduzido={!!reduzido} />}

        <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={spring.snappy} className="shrink-0 text-faint">
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 sm:px-5">
              {/* escolha do canal */}
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {canais.map((c) => (
                  <button
                    key={c.chave}
                    onClick={() => setCanal(c.chave)}
                    className={cn(
                      "min-h-[34px] shrink-0 rounded-full px-3 text-xs font-semibold transition",
                      canal === c.chave
                        ? "bg-accent text-white"
                        : "border border-border text-muted hover:border-accent/40 hover:text-text"
                    )}
                  >
                    {c.rotulo}
                  </button>
                ))}
              </div>

              {carregando ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin text-faint" />
                </div>
              ) : erro ? (
                <p className="py-4 text-center text-sm text-muted">{erro}</p>
              ) : estacoes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  Nenhuma estação disponível nesse canal agora.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {estacoes.map((e) => {
                    const ativa = tocando?.id === e.id;
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => tocar(e)}
                          className={cn(
                            "focus-ring flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                            ativa ? "bg-accent/12" : "hover:bg-surface2"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              ativa ? "bg-accent text-white" : "bg-surface2 text-muted"
                            )}
                          >
                            {conectando && ativa ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : ativa ? (
                              <Square size={13} fill="currentColor" />
                            ) : (
                              <Play size={14} className="ml-0.5" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-sm", ativa ? "font-semibold text-accent" : "text-text")}>
                              {e.nome}
                            </span>
                            {e.tags.length > 0 && (
                              <span className="block truncate text-[11px] text-faint">{e.tags.join(" · ")}</span>
                            )}
                          </span>

                          {ativa && <Volume2 size={15} className="shrink-0 text-accent" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                As estações são transmissões públicas de terceiros, listadas pelo diretório aberto Radio Browser. O
                Enlace só toca o sinal — não guarda nem redistribui nada.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        preload="none"
        onError={() => {
          setConectando(false);
          setTocando(null);
          setErro("A transmissão caiu. Tente outra estação.");
        }}
      />
    </section>
  );
}

/** Barrinhas de equalizador — só o suficiente para dizer "tem som tocando". */
function BarrinhasNoAr({ reduzido }: { reduzido: boolean }) {
  if (reduzido) return <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />;
  return (
    <span className="flex h-4 shrink-0 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-accent"
          animate={{ height: ["25%", "100%", "45%", "80%", "25%"] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.17, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
