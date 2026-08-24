"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { MascotState, MascotMood, MascotFeature } from "@/nucleo/mascote";


import { CREME, CREME_ESCURO, DURACAO, OLHO, OLHO_CLARO, PONTA, PONTA_ESCURA, type Acao } from "./mascote/constantes";
import { Asas, Aura, Aureola, Bigodes, Cachecol, Cauda, Coleira, Coroa, Estrelas, Flor, Focinho, Lacinho, Novelo, Oculos, Olhos, Orelhas, Patas } from "./mascote/PartesMascote";

/**
 * O gatinho siamês do casal.
 *
 * Nada aqui é imagem pronta: pelagem creme, "pontos" escuros (orelhas, focinho,
 * patas e cauda) e os olhos azuis amendoados do siamês, tudo em paths.
 *
 * Ele se mexe sozinho: além dos laços contínuos (respirar, piscar, cauda,
 * orelhas), um relógio interno sorteia uma ação a cada poucos segundos —
 * espreguiçar, pular, lamber a patinha, olhar para os lados, ronronar. As ações
 * possíveis mudam com o humor: um gato sonolento não fica pulando.
 *
 * A pelagem é sempre siamesa; o que vem do casal é a cor da coleira, da aura e
 * dos brilhos, para o bichinho continuar sendo "deles" sem deixar de ser gato.
 */


export function Mascote({
  state,
  size = 220,
  className,
  interactive = false,
  passear = true,
}: {
  state: MascotState;
  size?: number;
  className?: string;
  /** Ativa o toque: o gatinho reage com squash-and-stretch e coraçõezinhos. */
  interactive?: boolean;
  /** Deixa o gatinho andar pela área em vez de ficar num ponto fixo. */
  passear?: boolean;
}) {
  const reduced = useReducedMotion();
  const { mood, features, stage, bodyColor } = state;

  const controls = useAnimationControls();
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const heartId = useRef(0);
  const caixa = useRef<HTMLDivElement>(null);

  /* ── vida própria ───────────────────────────────────────────────────── */
  const [acao, setAcao] = useState<Acao>("parado");
  const [olhar, setOlhar] = useState({ x: 0, y: 0 });

  /* ── passeio ────────────────────────────────────────────────────────────
     O que fazia o bichinho parecer mecânico não era a falta de animação: era
     tudo se mexer no mesmo relógio, num ponto fixo, com curvas `easeInOut`
     que chegam sempre igual. Aqui a posição vira física — `useSpring` com
     massa e amortecimento — e o alvo muda em intervalos irregulares. O corpo
     não "toca uma animação": ele persegue um alvo e chega com inércia, que é
     o que o olho lê como vivo.

     `mass` alto de propósito: gato tem peso, freia devagar. */
  const alvoX = useMotionValue(0);
  const alvoY = useMotionValue(0);
  const px = useSpring(alvoX, { stiffness: 24, damping: 13, mass: 1.2 });
  const py = useSpring(alvoY, { stiffness: 20, damping: 14, mass: 1.2 });
  /* Inclina para o lado que está indo — antecipação, não decoração. */
  const inclina = useTransform(px, [-size * 0.2, size * 0.2], [-6, 6]);

  useEffect(() => {
    if (reduced || !passear || stage === 0) return;
    let vivo = true;
    let t: ReturnType<typeof setTimeout>;
    const raio = size * 0.16;

    const andar = () => {
      if (!vivo) return;
      // Alvo novo, mas nunca longe demais do anterior: gato não teleporta.
      const dx = (Math.random() - 0.5) * 2 * raio;
      const dy = (Math.random() - 0.5) * raio * 0.7;
      alvoX.set(Math.max(-raio, Math.min(raio, alvoX.get() * 0.35 + dx)));
      alvoY.set(Math.max(-raio * 0.7, Math.min(raio * 0.7, alvoY.get() * 0.35 + dy)));
      // Intervalos irregulares: o ritmo regular é o que denuncia a máquina.
      t = setTimeout(andar, 1800 + Math.random() * 3200);
    };

    t = setTimeout(andar, 600 + Math.random() * 1200);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [reduced, passear, stage, size, alvoX, alvoY]);

  /* O olhar acompanha o ponteiro — de longe, é o detalhe que mais faz o
     bichinho parecer consciente de quem está olhando. */
  useEffect(() => {
    if (reduced || stage === 0 || typeof window === "undefined") return;
    let raf = 0;
    const mover = (e: PointerEvent) => {
      if (raf) return; // no máximo um cálculo por quadro
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = caixa.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (d > 520) return; // ponteiro longe: o gato ignora
        setOlhar({
          x: Math.max(-6, Math.min(6, ((e.clientX - cx) / r.width) * 9)),
          y: Math.max(-3.5, Math.min(3.5, ((e.clientY - cy) / r.height) * 5)),
        });
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, stage]);

  useEffect(() => {
    if (reduced || stage === 0) return;
    let esperando: ReturnType<typeof setTimeout>;
    let agindo: ReturnType<typeof setTimeout>;
    let vivo = true;

    // Gato com sono ou com saudade se mexe menos — e nunca pula.
    const repertorio: Acao[] =
      mood === "sonolento" || mood === "saudade"
        ? ["olhar", "sacudir", "parado"]
        : mood === "radiante" || mood === "animado"
          ? ["pular", "alongar", "lamber", "olhar", "ronronar", "sacudir", "pular"]
          : ["alongar", "lamber", "olhar", "ronronar", "sacudir"];

    const ciclo = () => {
      if (!vivo) return;
      esperando = setTimeout(
        () => {
          if (!vivo) return;
          const a = repertorio[Math.floor(Math.random() * repertorio.length)];
          setAcao(a);
          if (a === "olhar") {
            setOlhar({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 3.5 });
          }
          agindo = setTimeout(() => {
            if (!vivo) return;
            setAcao("parado");
            setOlhar({ x: 0, y: 0 });
            ciclo();
          }, DURACAO[a] || 600);
        },
        2400 + Math.random() * 3400
      );
    };

    ciclo();
    return () => {
      vivo = false;
      clearTimeout(esperando);
      clearTimeout(agindo);
    };
  }, [reduced, mood, stage]);

  function poke() {
    if (!interactive) return;
    if (!reduced) {
      controls.start({
        scaleX: [1, 1.16, 0.88, 1.05, 1],
        scaleY: [1, 0.82, 1.14, 0.95, 1],
        transition: { duration: 0.55, ease: "easeOut" },
      });
    }
    setHearts((h) => [...h, { id: heartId.current++, x: 100 + (Math.random() - 0.5) * 70 }]);
  }

  // Fase 0: ainda é um novelinho enrolado dormindo.
  if (stage === 0) {
    return (
      <div className={className} style={{ width: size, height: size, position: "relative" }}>
        <Novelo reduced={!!reduced} accent={bodyColor} size={size} />
      </div>
    );
  }

  /* Fases: filhote é pequeno e cabeçudo; adulto é maior e mais esguio. */
  const escala = stage === 1 ? 0.74 : stage === 2 ? 0.87 : 1;
  const cabecudo = stage === 1 ? 1.14 : stage === 2 ? 1.06 : 1;
  const lendario = stage >= 4;

  /* Animação do corpo inteiro conforme a ação sorteada. */
  const animCorpo =
    reduced || acao === "parado"
      ? { y: [0, -3.5, 0] }
      : acao === "pular"
        ? { y: [0, -26, 0, -8, 0], scaleY: [1, 1.05, 0.9, 1.02, 1] }
        : acao === "alongar"
          ? { scaleX: [1, 1.14, 1], scaleY: [1, 0.9, 1], y: [0, 4, 0] }
          : acao === "ronronar"
            ? { x: [0, -1.4, 1.4, -1, 1, 0], y: [0, -2, 0] }
            : { y: [0, -3.5, 0] };

  const transCorpo =
    acao === "parado" || reduced
      ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: DURACAO[acao] / 1000, ease: "easeInOut" as const };

  /* Animação só da cabeça. */
  const animCabeca =
    reduced || acao === "parado"
      ? {}
      : acao === "sacudir"
        ? { rotate: [0, -7, 6, -4, 0] }
        : acao === "lamber"
          ? { rotate: [0, 14, 14, 0], y: [0, 6, 6, 0] }
          : acao === "olhar"
            ? { rotate: olhar.x * 1.6 }
            : {};

  return (
    <motion.div
      ref={caixa}
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        // A posição é física (spring), não uma animação declarada. `x`/`y`/
        // `rotate` são compostos na GPU — o passeio não custa layout.
        x: reduced || !passear ? 0 : px,
        y: reduced || !passear ? 0 : py,
        rotate: reduced || !passear ? 0 : inclina,
        willChange: "transform",
      }}
      onClick={poke}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Fazer carinho no gatinho" : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                poke();
              }
            }
          : undefined
      }
    >
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{ overflow: "visible", cursor: interactive ? "pointer" : "default" }}
      >
        <defs>
          <radialGradient id="gato-pelo" cx="0.4" cy="0.3">
            <stop offset="0" stopColor="#FFF7EC" />
            <stop offset="0.62" stopColor={CREME} />
            <stop offset="1" stopColor={CREME_ESCURO} />
          </radialGradient>
          <radialGradient id="gato-ponta" cx="0.4" cy="0.28">
            <stop offset="0" stopColor="#5E4A3D" />
            <stop offset="1" stopColor={PONTA_ESCURA} />
          </radialGradient>
          {/* máscara facial do siamês: escura no meio, dissolvendo nas bordas */}
          <radialGradient id="gato-mascara" cx="0.5" cy="0.5">
            <stop offset="0" stopColor={PONTA} stopOpacity="0.72" />
            <stop offset="0.5" stopColor={PONTA} stopOpacity="0.5" />
            <stop offset="1" stopColor={PONTA} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gato-olho" cx="0.42" cy="0.34">
            <stop offset="0" stopColor={OLHO_CLARO} />
            <stop offset="1" stopColor={OLHO} />
          </radialGradient>
          <filter id="gato-sombra" x="-40%" y="-30%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="4.5" floodColor="#000" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* aura da fase lendária */}
        {lendario && <Aura accent={bodyColor} reduced={!!reduced} />}

        {/* sombra no chão — encolhe quando ele pula */}
        <motion.ellipse
          cx="100"
          cy="186"
          rx="48"
          ry="7.5"
          fill="rgba(0,0,0,0.16)"
          animate={reduced || acao !== "pular" ? {} : { rx: [48, 34, 48, 42, 48], opacity: [1, 0.6, 1, 0.8, 1] }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* coraçõezinhos do carinho */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.text
              key={h.id}
              x={h.x}
              y={70}
              fontSize="17"
              textAnchor="middle"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={
                reduced
                  ? { opacity: [0, 1, 0] }
                  : { opacity: [0, 1, 1, 0], y: [70, 64, 20, 4], scale: [0.4, 1.2, 1, 0.85] }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              onAnimationComplete={() => setHearts((hs) => hs.filter((x) => x.id !== h.id))}
            >
              💗
            </motion.text>
          ))}
        </AnimatePresence>

        {/* ronronar solta notinhas */}
        <AnimatePresence>
          {acao === "ronronar" && !reduced && (
            <motion.text
              x="150"
              y="86"
              fontSize="15"
              fill={bodyColor}
              initial={{ opacity: 0, y: 86 }}
              animate={{ opacity: [0, 0.9, 0], y: [86, 66, 50] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            >
              ♪
            </motion.text>
          )}
        </AnimatePresence>

        {/* toque: squash-and-stretch por cima de tudo */}
        <motion.g animate={controls} style={{ transformOrigin: "100px 178px" }}>
          {/* ação sorteada */}
          <motion.g animate={animCorpo} transition={transCorpo} style={{ transformOrigin: "100px 178px" }}>
            <g
              filter="url(#gato-sombra)"
              transform={`translate(${(1 - escala) * 100}, ${(1 - escala) * 178}) scale(${escala})`}
            >
              {/* acessórios que ficam atrás */}
              {features.includes("asas") && <Asas reduced={!!reduced} />}

              <Cauda mood={mood} acao={acao} reduced={!!reduced} lendario={lendario} />

              {/* patas traseiras (pontas escuras) */}
              <ellipse cx="74" cy="172" rx="15" ry="9" fill="url(#gato-ponta)" />
              <ellipse cx="126" cy="172" rx="15" ry="9" fill="url(#gato-ponta)" />

              {/* corpo */}
              <ellipse cx="100" cy="136" rx="45" ry="41" fill="url(#gato-pelo)" />
              {/* peito mais claro */}
              <ellipse cx="100" cy="146" rx="28" ry="29" fill="#FFFCF6" opacity="0.75" />

              {/* patinhas da frente — "luvas" escuras do siamês */}
              <Patas mood={mood} acao={acao} reduced={!!reduced} />

              {/* Coleira com a cor do casal. Some quando ele está de cachecol —
                  os dois no mesmo pescoço viravam um amontoado. */}
              {stage >= 2 && !features.includes("cachecol") && (
                <Coleira accent={bodyColor} lendario={lendario} />
              )}

              {/* cabeça */}
              <motion.g
                animate={animCabeca}
                transition={{ duration: (DURACAO[acao] || 600) / 1000, ease: "easeInOut" }}
                style={{ transformOrigin: "100px 118px" }}
              >
                <g transform={`translate(100 100) scale(${cabecudo}) translate(-100 -100)`}>
                  <Orelhas acao={acao} reduced={!!reduced} />

                  {/* crânio */}
                  <ellipse cx="100" cy="92" rx="42" ry="38" fill="url(#gato-pelo)" />
                  {/* máscara facial: estreita, para as bochechas continuarem creme */}
                  <ellipse cx="100" cy="105" rx="25" ry="24" fill="url(#gato-mascara)" />

                  <Bigodes />
                  <Focinho acao={acao} reduced={!!reduced} />
                  <Olhos mood={mood} acao={acao} olhar={olhar} reduced={!!reduced} />

                  {/* acessórios da cabeça */}
                  {features.includes("oculos") && <Oculos />}
                  {features.includes("coroa") && <Coroa />}
                  {features.includes("flor") && <Flor />}
                  {features.includes("lacinho") && <Lacinho />}
                  {features.includes("aureola") && <Aureola reduced={!!reduced} />}
                </g>
              </motion.g>

              {features.includes("cachecol") && <Cachecol />}
              {features.includes("estrelas") && <Estrelas accent={bodyColor} reduced={!!reduced} />}
            </g>
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

/* ── Fase 0: novelo enrolado ─────────────────────────────────────────────── */

export type { MascotFeature };
