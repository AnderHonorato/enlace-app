"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ImagePlus, MessageCircle, Send, SmilePlus, Star, X } from "lucide-react";
import { api } from "@/nucleo/cliente";
import { compressImage } from "@/nucleo/imagem";
import { REACTION_EMOJIS, type EntryDTO } from "@/nucleo/memorias";
import { collapse, heartBeat, listItem, spring } from "@/nucleo/movimento";
import { relTime, cn } from "@/nucleo/utilitarios";
import type { Me } from "@/nucleo/usuario-atual";
import { Avatar } from "../Avatar";
import { AiMark } from "../Papelaria";
import { toast } from "../Avisos";
import { openLightbox } from "../VisualizadorMidia";

type PropriedadesInteracoesMemoria = {
  memoria: EntryDTO;
  usuario: Me;
  podeInteragir: boolean;
  destaqueComentarioId?: string | null;
  comentariosAbertos?: boolean;
};

export function InteracoesMemoria({
  memoria,
  usuario,
  podeInteragir,
  destaqueComentarioId = null,
  comentariosAbertos = false,
}: PropriedadesInteracoesMemoria) {
  const [curtida, setCurtida] = useState(memoria.likedByMe);
  const [totalCurtidas, setTotalCurtidas] = useState(memoria.likeCount);
  const [favorita, setFavorita] = useState(memoria.favorite);
  const [reacoes, setReacoes] = useState(memoria.reactions);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [mostrarComentarios, setMostrarComentarios] = useState(comentariosAbertos);
  const [comentarios, setComentarios] = useState(memoria.comments);
  const [rascunho, setRascunho] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const arquivo = useRef<HTMLInputElement>(null);
  const [explosoes, setExplosoes] = useState<{ id: number; emoji: string }[]>([]);
  const proximaExplosao = useRef(0);

  useEffect(() => {
    setCurtida(memoria.likedByMe);
    setTotalCurtidas(memoria.likeCount);
    setFavorita(memoria.favorite);
    setReacoes(memoria.reactions);
    setComentarios(memoria.comments);
  }, [memoria]);

  useEffect(() => {
    if (comentariosAbertos) setMostrarComentarios(true);
  }, [comentariosAbertos, destaqueComentarioId]);

  function animarReacao(emoji: string) {
    const id = proximaExplosao.current++;
    setExplosoes((atuais) => [...atuais, { id, emoji }]);
    window.setTimeout(() => setExplosoes((atuais) => atuais.filter((item) => item.id !== id)), 1_000);
  }

  async function reagir(emoji: string) {
    setSeletorAberto(false);
    const anteriores = reacoes;
    const jaEraMinha = reacoes.find((reacao) => reacao.emoji === emoji)?.mine;
    if (!jaEraMinha) animarReacao(emoji);
    setReacoes((atuais) => {
      const encontrada = atuais.find((reacao) => reacao.emoji === emoji);
      if (!encontrada) return [...atuais, { emoji, count: 1, mine: true }];
      return atuais
        .map((reacao) => reacao.emoji === emoji
          ? { ...reacao, count: reacao.count + (reacao.mine ? -1 : 1), mine: !reacao.mine }
          : reacao)
        .filter((reacao) => reacao.count > 0);
    });
    if (emoji === "❤️") {
      setCurtida((atual) => !atual);
      setTotalCurtidas((atual) => atual + (curtida ? -1 : 1));
    }
    try {
      const resposta = await api<{ liked: boolean; count: number }>(`/api/entries/${memoria.id}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
      if (emoji === "❤️") {
        setCurtida(resposta.liked);
        setTotalCurtidas(resposta.count);
      }
    } catch {
      setReacoes(anteriores);
    }
  }

  async function alternarFavorita() {
    const proxima = !favorita;
    setFavorita(proxima);
    try {
      const resposta = await api<{ favorite: boolean }>(`/api/entries/${memoria.id}/favorite`, { method: "POST" });
      setFavorita(resposta.favorite);
      if (resposta.favorite) toast("Memória especial", "success");
    } catch {
      setFavorita(!proxima);
    }
  }

  async function escolherImagens(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const espaco = 4 - imagens.length;
    for (const item of Array.from(arquivos).slice(0, espaco)) {
      if (!item.type.startsWith("image/")) continue;
      try {
        const imagem = await compressImage(item, 1200, 0.7);
        setImagens((atuais) => atuais.length >= 4 ? atuais : [...atuais, imagem.url]);
      } catch {
        toast("Não consegui processar a imagem.", "error");
      }
    }
    if (arquivo.current) arquivo.current.value = "";
  }

  async function adicionarComentario(evento: React.FormEvent) {
    evento.preventDefault();
    const conteudo = rascunho.trim();
    const anexos = imagens;
    if (!conteudo && anexos.length === 0) return;
    setRascunho("");
    setImagens([]);
    try {
      const resposta = await api<{ comment: EntryDTO["comments"][number] }>(`/api/entries/${memoria.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: conteudo, images: anexos }),
      });
      setComentarios((atuais) => [...atuais, resposta.comment]);
    } catch (erro: any) {
      toast(erro.message, "error");
      setRascunho(conteudo);
      setImagens(anexos);
    }
  }

  async function removerComentario(id: string) {
    setComentarios((atuais) => atuais.filter((comentario) => comentario.id !== id));
    await api(`/api/comments/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function curtirComentario(id: string) {
    const anteriores = comentarios;
    setComentarios((atuais) => atuais.map((comentario) => comentario.id === id
      ? { ...comentario, likedByMe: !comentario.likedByMe, likeCount: comentario.likeCount + (comentario.likedByMe ? -1 : 1) }
      : comentario));
    try {
      const resposta = await api<{ liked: boolean; count: number }>(`/api/comments/${id}/like`, {
        method: "POST",
        body: JSON.stringify({ emoji: "❤️" }),
      });
      setComentarios((atuais) => atuais.map((comentario) => comentario.id === id
        ? { ...comentario, likedByMe: resposta.liked, likeCount: resposta.count }
        : comentario));
    } catch (erro: any) {
      setComentarios(anteriores);
      toast(erro.message, "error");
    }
  }

  const reacoesVisiveis = reacoes.filter((reacao) => reacao.emoji !== "❤️");

  return (
    <>
      {reacoesVisiveis.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-1">
          <AnimatePresence>
            {reacoesVisiveis.map((reacao) => (
              <motion.button
                key={reacao.emoji}
                layout
                initial={{ opacity: 0, scale: 0.4, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.4, y: 6 }}
                transition={spring.bouncy}
                whileHover={{ y: -2, scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => reagir(reacao.emoji)}
                disabled={!podeInteragir}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors disabled:opacity-40",
                  reacao.mine ? "border-accent bg-accent/10" : "border-border bg-surface2 hover:bg-surface2/70"
                )}
              >
                <span>{reacao.emoji}</span>
                <span className="text-xs font-medium tabular-nums text-muted">{reacao.count}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="relative flex items-center gap-1 border-t border-border px-3 py-2">
        <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-start pl-4">
          <AnimatePresence>{explosoes.map((item) => <ExplosaoEmoji key={item.id} emoji={item.emoji} />)}</AnimatePresence>
        </div>
        <motion.button
          onClick={() => reagir("❤️")}
          disabled={!podeInteragir}
          whileTap={{ scale: 0.88 }}
          className={cn(
            "flex h-[34px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition disabled:opacity-40",
            curtida ? "text-accent" : "text-muted hover:bg-surface2 hover:text-text"
          )}
        >
          <Heart size={18} className={curtida ? "fill-accent text-accent" : ""} />
          {totalCurtidas > 0 && <span className="tabular-nums">{totalCurtidas}</span>}
        </motion.button>

        <div className="relative">
          <button
            onClick={() => setSeletorAberto((aberto) => !aberto)}
            disabled={!podeInteragir}
            title="Reagir"
            className="flex h-[34px] items-center rounded-lg px-2.5 text-sm text-muted transition hover:bg-surface2 hover:text-text disabled:opacity-40"
          >
            <SmilePlus size={18} />
          </button>
          <AnimatePresence>
            {seletorAberto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSeletorAberto(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-11 left-0 z-20 flex gap-0.5 rounded-full border border-border bg-surface p-1.5 shadow-card"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <motion.button key={emoji} whileHover={{ scale: 1.35, y: -3 }} onClick={() => reagir(emoji)} className="rounded-full p-1 text-xl leading-none">
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={() => setMostrarComentarios((mostrar) => !mostrar)}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex h-[34px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
            mostrarComentarios ? "text-accent" : "text-muted hover:bg-surface2 hover:text-text"
          )}
        >
          <MessageCircle size={18} /> {comentarios.length > 0 && comentarios.length}
        </motion.button>
        <button
          onClick={alternarFavorita}
          disabled={!podeInteragir}
          title={favorita ? "Memória especial" : "Marcar como especial"}
          className={cn(
            "ml-auto flex h-[34px] items-center rounded-lg px-3 transition disabled:opacity-40",
            favorita ? "text-gold" : "text-faint hover:bg-surface2 hover:text-gold"
          )}
        >
          <Star size={18} className={favorita ? "fill-warning" : ""} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mostrarComentarios && (
          <motion.div variants={collapse} initial="hidden" animate="show" exit="exit" className="overflow-hidden border-t border-border bg-surface2">
            <div className="space-y-3 p-4">
              {comentarios.length === 0 && <p className="text-center text-sm text-faint">Seja o primeiro a comentar.</p>}
              <AnimatePresence initial={false}>
                {comentarios.map((comentario, indice) => (
                  <motion.div
                    key={comentario.id}
                    layout
                    variants={listItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    custom={indice}
                    className="flex items-start gap-2.5"
                  >
                    {comentario.isAI ? (
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm shadow-glow">
                        <AiMark size={15} className="text-white" />
                      </span>
                    ) : (
                      <Avatar name={comentario.author.displayName || comentario.author.name} color={comentario.author.avatarColor} url={comentario.author.avatarUrl} size={30} />
                    )}
                    <div className={cn(
                      "min-w-0 flex-1 rounded-[3px_12px_12px_12px] px-3 py-2 transition",
                      comentario.isAI ? "border border-accent/30 bg-accent/[0.06]" : "bg-surface",
                      destaqueComentarioId === comentario.id && "ring-2 ring-accent/60"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", comentario.isAI ? "text-accentInk" : "text-text")}>{comentario.author.displayName || comentario.author.name}</span>
                        {comentario.isAI && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-accentInk">IA</span>}
                        <span className="text-[11px] text-faint">{relTime(comentario.createdAt)}</span>
                        {(comentario.isMine || memoria.isMine) && (
                          <button onClick={() => removerComentario(comentario.id)} className="ml-auto text-faint transition hover:text-danger"><X size={13} /></button>
                        )}
                      </div>
                      {comentario.content && <p className={cn("prose-amora text-sm", comentario.isAI ? "italic text-accentInk" : "text-muted")}>{comentario.content}</p>}
                      {comentario.images?.length > 0 && (
                        <div className={cn("mt-1.5 gap-1", comentario.images.length === 1 ? "" : "grid grid-cols-2")}>
                          {comentario.images.map((url: string, posicao: number) => (
                            <button key={posicao} type="button" onClick={() => openLightbox(comentario.images, posicao)} className="block overflow-hidden rounded-xl border border-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" loading="lazy" decoding="async" className="max-h-56 w-full cursor-zoom-in object-cover transition hover:opacity-90" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 flex items-center">
                        <motion.button
                          onClick={() => curtirComentario(comentario.id)}
                          disabled={!podeInteragir}
                          whileTap={{ scale: 0.85 }}
                          title={comentario.likedByMe ? "Remover curtida" : "Curtir comentário"}
                          className={cn(
                            "-ml-1 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium transition disabled:opacity-40",
                            comentario.likedByMe ? "text-accent" : "text-faint hover:bg-surface hover:text-accent"
                          )}
                        >
                          <motion.span key={String(comentario.likedByMe)} animate={comentario.likedByMe ? heartBeat : {}}>
                            <Heart size={13} className={comentario.likedByMe ? "fill-accent text-accent" : ""} />
                          </motion.span>
                          {comentario.likeCount > 0 && <span className="tabular-nums">{comentario.likeCount}</span>}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {podeInteragir && (
                <form onSubmit={adicionarComentario} className="pt-1">
                  {imagens.length > 0 && (
                    <div className="mb-2 ml-10 flex flex-wrap gap-2">
                      {imagens.map((url, indice) => (
                        <div key={indice} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-20 w-20 rounded-xl border border-border object-cover" />
                          <button type="button" onClick={() => setImagens((atuais) => atuais.filter((_, posicao) => posicao !== indice))} className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 p-1 text-white">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Avatar name={usuario.displayName || usuario.name} color={usuario.avatarColor} url={usuario.avatarUrl} size={30} />
                    <input value={rascunho} onChange={(evento) => setRascunho(evento.target.value)} placeholder="Escreva um comentário carinhoso…" className="focus-ring flex-1 rounded-full border border-border bg-bg2 px-3.5 py-2 text-sm text-text placeholder:text-faint" />
                    <input ref={arquivo} type="file" accept="image/*" multiple hidden onChange={(evento) => escolherImagens(evento.target.files)} />
                    <button type="button" onClick={() => arquivo.current?.click()} disabled={imagens.length >= 4} title="Adicionar foto" className="rounded-full p-2 text-faint transition hover:bg-surface2 hover:text-accent disabled:opacity-40">
                      <ImagePlus size={18} />
                    </button>
                    <button type="submit" disabled={!rascunho.trim() && imagens.length === 0} className="rounded-full accent-gradient p-2 text-white transition hover:brightness-110 disabled:opacity-40">
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ExplosaoEmoji({ emoji }: { emoji: string }) {
  const particulas = [
    { x: -22, rotacao: -30, atraso: 0 },
    { x: -8, rotacao: -10, atraso: 0.04 },
    { x: 8, rotacao: 12, atraso: 0.08 },
    { x: 24, rotacao: 28, atraso: 0.02 },
  ];
  return (
    <span className="absolute">
      {particulas.map((particula, indice) => (
        <motion.span
          key={indice}
          className="absolute text-lg"
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -46, x: particula.x, scale: [0.5, 1.2, 1, 0.9], rotate: particula.rotacao }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, delay: particula.atraso, ease: [0.22, 1, 0.36, 1] }}
        >
          {emoji}
        </motion.span>
      ))}
    </span>
  );
}
