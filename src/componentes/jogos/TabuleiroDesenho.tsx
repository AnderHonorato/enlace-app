"use client";

/**
 * Desenho & Adivinha — o tabuleiro.
 *
 * Duas decisões que definem este componente:
 *
 * 1. **Coordenadas normalizadas (0..1).** O servidor só guarda números; quem
 *    decide a escala é o cliente. Guardando 0..1 em vez de pixels, o mesmo
 *    traço desenhado num celular de 360px aparece igual num monitor de 1440px.
 *    Se guardássemos pixels, o desenho do parceiro chegaria deslocado e cortado.
 *
 * 2. **O traço é enviado no `pointerup`, não a cada ponto.** Não há websocket
 *    neste projeto — o parceiro recebe por polling de 3s. Mandar ponto a ponto
 *    seria uma requisição a cada milissegundo de risco, e ainda assim o outro
 *    lado só veria de 3 em 3 segundos. Um POST por traço é o mesmo resultado
 *    visual por uma fração do custo.
 *
 * Enquanto o traço está sendo feito ele é desenhado localmente na hora
 * (`emCurso`), então quem desenha nunca sente atraso — a espera é só do outro
 * lado, que é inerente ao polling.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eraser, Flag, Send, Loader2 } from "lucide-react";
import { Etiqueta } from "../Papelaria";
import { cn } from "@/nucleo/utilitarios";

type Traco = { pontos: [number, number][]; cor: string; largura: number };

type EstadoDesenho = {
  turnUserId: string;
  palavra: string | null; // null = você é quem adivinha
  tracos: Traco[];
  palpites: { userId: string; texto: string; at: number; correto: boolean }[];
  resolvido: boolean;
  desistiu: boolean;
  rounds: number;
};

/** Espessuras oferecidas — nomeadas pelo uso, não pelo número de pixels. */
const PENAS = [
  { nome: "Fina", largura: 2 },
  { nome: "Média", largura: 5 },
  { nome: "Grossa", largura: 11 },
];

export function DesenhoBoard({
  estado,
  souEuQuemDesenha,
  ocupado,
  onJogar,
}: {
  estado: EstadoDesenho;
  souEuQuemDesenha: boolean;
  ocupado?: boolean;
  onJogar: (move: Record<string, any>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(5);
  const [palpite, setPalpite] = useState("");
  const emCurso = useRef<[number, number][]>([]);
  const desenhando = useRef(false);

  /* ── pintura ──────────────────────────────────────────────────────────── */
  const redesenhar = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = cv;

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const tinta = getComputedStyle(cv).getPropertyValue("color") || "#17140F";

    const traçar = (pts: [number, number][], px: number) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.lineWidth = px;
      ctx.strokeStyle = tinta;
      ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
      ctx.stroke();
    };

    // A largura vem em unidades de "canvas de 1000px" para escalar junto.
    for (const t of estado.tracos) traçar(t.pontos, (t.largura / 1000) * w);
    if (emCurso.current.length > 1) traçar(emCurso.current, (largura / 1000) * w);
  }, [estado.tracos, largura]);

  /* Canvas nítido em tela retina: o buffer é medido em pixels reais, o CSS em
     pixels lógicos. Sem isso o traço fica borrado no celular. */
  useEffect(() => {
    const cv = canvasRef.current;
    const box = boxRef.current;
    if (!cv || !box) return;
    const ajustar = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.width * dpr); // quadrado
      cv.style.height = `${Math.round(r.width)}px`;
      redesenhar();
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(box);
    return () => ro.disconnect();
  }, [redesenhar]);

  useEffect(() => {
    redesenhar();
  }, [redesenhar]);

  /* ── entrada do desenhista ────────────────────────────────────────────── */
  const podeDesenhar = souEuQuemDesenha && !estado.resolvido && !ocupado;

  function posicao(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    ];
  }

  function inicio(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!podeDesenhar) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    emCurso.current = [posicao(e)];
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    const p = posicao(e);
    const ult = emCurso.current[emCurso.current.length - 1];
    // Descarta micro-movimentos: menos pontos, mesma curva, payload menor
    // (o servidor corta em 250 pontos por traço).
    if (ult && Math.hypot(p[0] - ult[0], p[1] - ult[1]) < 0.006) return;
    emCurso.current.push(p);
    redesenhar();
  }

  function fim() {
    if (!desenhando.current) return;
    desenhando.current = false;
    const pontos = emCurso.current;
    emCurso.current = [];
    if (pontos.length < 2) {
      redesenhar();
      return;
    }
    onJogar({ type: "traco", pontos, largura });
  }

  return (
    <div className="space-y-3">
      {/* faixa da palavra / do papel */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border2 bg-surface px-3.5 py-2.5">
        <div className="min-w-0">
          <Etiqueta tone={souEuQuemDesenha ? "accent" : "ink"}>
            {souEuQuemDesenha ? "Você desenha" : "Você adivinha"}
          </Etiqueta>
          <p className="mt-1.5 truncate font-display text-[21px] leading-tight tracking-[-0.015em] text-text">
            {estado.palavra ? estado.palavra : "• • • • •"}
          </p>
        </div>
        <span className="kicker-sm shrink-0">rodada {estado.rounds + 1}</span>
      </div>

      {/* o quadro */}
      <div
        ref={boxRef}
        className="relative overflow-hidden rounded-2xl border border-border2 bg-surface"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={inicio}
          onPointerMove={mover}
          onPointerUp={fim}
          onPointerCancel={fim}
          className={cn(
            "block w-full text-text",
            // `touch-none` é essencial no celular: sem ele o navegador rola a
            // página em vez de deixar o dedo desenhar.
            podeDesenhar ? "cursor-crosshair touch-none" : "cursor-default"
          )}
        />
        {estado.resolvido ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/92 text-center"
          >
            <p className="font-display text-[26px] leading-tight tracking-[-0.02em] text-text">
              {estado.desistiu ? "Rodada encerrada" : "Acertou!"}
            </p>
            <p className="text-[13.5px] text-muted">
              A palavra era <strong className="text-accentInk">{estado.palavra}</strong>
            </p>
            <button
              onClick={() => onJogar({ type: "novaRodada" })}
              disabled={ocupado}
              className="sheen mt-1 rounded-lg bg-text px-4 py-2.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
            >
              Próxima rodada — troca quem desenha
            </button>
          </motion.div>
        ) : null}
      </div>

      {/* controles */}
      {souEuQuemDesenha ? (
        !estado.resolvido ? (
          <div className="flex flex-wrap items-center gap-2">
            {PENAS.map((p) => (
              <button
                key={p.nome}
                onClick={() => setLargura(p.largura)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors",
                  largura === p.largura
                    ? "border-text bg-text text-bg"
                    : "border-border2 text-muted hover:bg-surface2 hover:text-text"
                )}
              >
                {p.nome}
              </button>
            ))}
            <span className="flex-1" />
            <button
              onClick={() => onJogar({ type: "limpar" })}
              disabled={ocupado || !estado.tracos.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border2 px-3 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-50"
            >
              <Eraser size={14} /> Limpar
            </button>
            <button
              onClick={() => onJogar({ type: "desistir" })}
              disabled={ocupado}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border2 px-3 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-50"
            >
              <Flag size={14} /> Desistir
            </button>
          </div>
        ) : null
      ) : !estado.resolvido ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = palpite.trim();
            if (!t) return;
            onJogar({ type: "chutar", texto: t });
            setPalpite("");
          }}
          className="flex items-center gap-2"
        >
          <input
            value={palpite}
            onChange={(e) => setPalpite(e.target.value)}
            placeholder="O que é isso?"
            maxLength={60}
            className="h-11 flex-1 rounded-lg border border-border2 bg-surface px-3.5 text-[14px] text-text placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={ocupado || !palpite.trim()}
            className="sheen inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-text px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
          >
            {ocupado ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Chutar
          </button>
        </form>
      ) : null}

      {/* palpites */}
      {estado.palpites.length ? (
        <ul className="space-y-1.5">
          {estado.palpites.slice(-5).reverse().map((p, i) => (
            <li
              key={`${p.at}-${i}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px]",
                p.correto
                  ? "border-accent/40 bg-accent/[0.07] font-semibold text-accentInk"
                  : "border-border2 text-muted"
              )}
            >
              <span className="truncate">{p.texto}</span>
              {p.correto ? <span className="ml-auto shrink-0 text-[11.5px]">acertou</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
