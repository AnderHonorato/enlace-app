"use client";

/**
 * Complete a Frase — o tabuleiro.
 *
 * Jogo simultâneo: não existe "sua vez" (`sessao.isMyTurn` fica sempre falso
 * aqui, porque `complete.ts` nunca define `turnUserId`). O que existe são só
 * três momentos, e é em cima deles que a tela é desenhada:
 *
 *   1. ninguém respondeu ainda / eu não respondi   → formulário aberto
 *   2. eu respondi, o parceiro ainda não           → espera (nunca "travado")
 *   3. os dois responderam                         → revelação lado a lado
 *
 * `complete.sanitize` (ver `src/nucleo/jogos/complete.ts`) só entrega o texto do
 * parceiro depois que `revealed` vira `true`; antes disso, a resposta dele
 * chega como `true`/`false` — só para saber SE ele já respondeu, nunca o quê.
 * Isso é o que o servidor manda; a tela não tenta adivinhar nada além disso.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Link2 } from "lucide-react";
import { EASE_OUT } from "@/nucleo/movimento";
import { Etiqueta } from "../Papelaria";

const MAX = 240;

type EstadoComplete = {
  round: number;
  phrase: string;
  answers: Record<string, string | boolean | null>;
  revealed: boolean;
  sintonia: boolean;
};

export function CompleteBoard({
  estado,
  meId,
  parceiroNome,
  ocupado,
  onJogar,
}: {
  estado: EstadoComplete;
  /** `sessao.meId` — a chave que identifica "minha" resposta dentro de `estado.answers`. */
  meId: string;
  parceiroNome: string;
  ocupado?: boolean;
  onJogar: (move: Record<string, unknown>) => void;
}) {
  const outroId = Object.keys(estado.answers).find((id) => id !== meId) ?? "";
  const meuValor = estado.answers[meId];
  // Enquanto não revelado, minha própria chave sempre traz o texto (ou null);
  // a do parceiro vira booleano. Então "sou string" = "eu já respondi".
  const jaRespondi = typeof meuValor === "string";
  const parceiroRespondeu = estado.revealed || Boolean(estado.answers[outroId]);

  const [texto, setTexto] = useState("");

  // A troca de rodada é o único sinal de que é hora de limpar o rascunho.
  useEffect(() => {
    setTexto("");
  }, [estado.round]);

  function enviar() {
    const t = texto.trim();
    if (!t || ocupado || jaRespondi) return;
    onJogar({ type: "responder", text: t });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="kicker-sm">Rodada {estado.round + 1}</span>
        <span className="kicker-sm">
          {estado.revealed ? "revelado" : jaRespondi ? "esperando resposta" : "sua vez de escrever"}
        </span>
      </div>

      <div className="rounded-2xl border border-border2 bg-bg2 px-4 py-4">
        <p className="font-display text-[21px] leading-snug tracking-[-0.02em] text-text">
          {estado.phrase}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {estado.revealed ? (
          <Revelacao
            key={`rev-${estado.round}`}
            estado={estado}
            meId={meId}
            outroId={outroId}
            parceiroNome={parceiroNome}
            ocupado={ocupado}
            onJogar={onJogar}
          />
        ) : jaRespondi ? (
          <Esperando key="esperando" parceiroNome={parceiroNome} minhaResposta={meuValor as string} />
        ) : (
          <Formulario
            key="form"
            texto={texto}
            setTexto={setTexto}
            ocupado={ocupado}
            parceiroRespondeu={parceiroRespondeu}
            parceiroNome={parceiroNome}
            onEnviar={enviar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Formulario({
  texto,
  setTexto,
  ocupado,
  parceiroRespondeu,
  parceiroNome,
  onEnviar,
}: {
  texto: string;
  setTexto: (v: string) => void;
  ocupado?: boolean;
  parceiroRespondeu: boolean;
  parceiroNome: string;
  onEnviar: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="mt-3"
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
        disabled={ocupado}
        placeholder="Escreva sua resposta…"
        rows={3}
        className="focus-ring w-full resize-none rounded-2xl border border-border2 bg-surface px-3.5 py-3 text-[14.5px] leading-relaxed text-text placeholder:text-faint disabled:opacity-60"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="kicker-sm">
          {parceiroRespondeu ? `${parceiroNome} já respondeu — sua vez` : `${texto.length}/${MAX}`}
        </span>
        <button
          onClick={onEnviar}
          disabled={ocupado || !texto.trim()}
          className="sheen inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-text px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-50"
        >
          <Send size={14} /> Enviar resposta
        </button>
      </div>
    </motion.div>
  );
}

/** Nunca deve parecer travado: os pontinhos deixam claro que o jogo está vivo, só esperando o outro lado. */
function Esperando({ parceiroNome, minhaResposta }: { parceiroNome: string; minhaResposta: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-border2 bg-surface px-4 py-6 text-center"
    >
      <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
        Sua resposta: <span className="italic text-text">&ldquo;{minhaResposta}&rdquo;</span>
      </p>
      <div className="flex items-center gap-2">
        <PulsoEspera />
        <span className="kicker-sm">esperando {parceiroNome}</span>
      </div>
    </motion.div>
  );
}

function PulsoEspera() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: EASE_OUT, delay: i * 0.16 }}
        />
      ))}
    </span>
  );
}

/** O momento inteiro do jogo: as duas respostas virando de vez, lado a lado. */
function Revelacao({
  estado,
  meId,
  outroId,
  parceiroNome,
  ocupado,
  onJogar,
}: {
  estado: EstadoComplete;
  meId: string;
  outroId: string;
  parceiroNome: string;
  ocupado?: boolean;
  onJogar: (move: Record<string, unknown>) => void;
}) {
  const meuTexto = String(estado.answers[meId] ?? "");
  const outroTexto = String(estado.answers[outroId] ?? "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className="mt-3"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <CartaResposta quem="Você" texto={meuTexto} delay={0} />
        <CartaResposta quem={parceiroNome} texto={outroTexto} delay={0.12} />
      </div>

      {estado.sintonia ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.34 }}
          className="mt-3 flex justify-center"
        >
          <Etiqueta tone="accent">
            <Link2 size={12} /> Sintonia — +15 para os dois
          </Etiqueta>
        </motion.div>
      ) : null}

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => onJogar({ type: "proxima" })}
          disabled={ocupado}
          className="sheen inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-text px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-50"
        >
          Próxima frase
        </button>
      </div>
    </motion.div>
  );
}

/** A "virada de carta": rotateX de costas (deitada) para de frente, com um leve atraso entre as duas. */
function CartaResposta({ quem, texto, delay }: { quem: string; texto: string; delay: number }) {
  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay }}
        style={{ transformOrigin: "50% 100%" }}
        className="rounded-2xl border border-border2 bg-surface px-3.5 py-3.5"
      >
        <span className="kicker-sm">{quem}</span>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-text">{texto}</p>
      </motion.div>
    </div>
  );
}
