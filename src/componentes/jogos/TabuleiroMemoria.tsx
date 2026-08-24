"use client";

/**
 * Memória do Casal — o tabuleiro.
 *
 * O servidor manda o baralho já censurado (`memoria.sanitize`): posições
 * escondidas chegam como `null`, e só carta virada ou já casada traz a face.
 * Isso importa — significa que abrir o devtools não revela o jogo, porque o
 * valor simplesmente não foi enviado.
 *
 * A virada é uma rotação 3D de verdade (`rotateY` + `backface-visibility`),
 * não uma troca de imagem: as duas faces existem no DOM ao mesmo tempo e o
 * navegador esconde a que está de costas. Sai mais barato que animar opacidade
 * de dois elementos e é o que dá o peso de carta virando.
 */

import { motion } from "framer-motion";
import {
  Mail, Film, Pizza, Moon, Coffee, Music, Camera, Flower2,
  Candy, PawPrint, Puzzle, Flame, HelpCircle,
} from "lucide-react";
import { cn } from "@/nucleo/utilitarios";

type EstadoMemoria = {
  board: (string | null)[];
  matched: boolean[];
  flipped: number[];
  totalPairs: number;
  round: number;
};

const ICONES: Record<string, typeof Mail> = {
  carta: Mail, filme: Film, pizza: Pizza, lua: Moon,
  cafe: Coffee, musica: Music, camera: Camera, flor: Flower2,
  chocolate: Candy, pata: PawPrint, quebracabeca: Puzzle, vela: Flame,
};

export function MemoriaBoard({
  estado,
  minhaVez,
  ocupado,
  onVirar,
}: {
  estado: EstadoMemoria;
  minhaVez: boolean;
  ocupado?: boolean;
  onVirar: (index: number) => void;
}) {
  const { board, matched, flipped, totalPairs } = estado;
  const feitos = matched.filter(Boolean).length / 2;
  // 12 cartas em 3 colunas viram quadrados enormes em tela larga (medido: ~200px
  // de lado num viewport de 680px). 4 colunas mantém a carta na mão em qualquer
  // largura; abaixo de 12 cartas, 3 colunas ainda fica proporcional.
  const colunas = board.length >= 12 ? 4 : 3;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="kicker-sm">
          {feitos} de {totalPairs} pares
        </span>
        <span className="kicker-sm">{minhaVez ? "vire duas cartas" : "espere sua vez"}</span>
      </div>

      {/* O teto de largura impede que a carta cresça sem limite no desktop —
          um jogo de memória se joga com a carta do tamanho da mão, não da tela. */}
      <div
        className="mx-auto grid w-full max-w-[440px] gap-2"
        style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
      >
        {board.map((face, i) => {
          const aberta = matched[i] || flipped.includes(i);
          const casada = matched[i];
          const podeClicar = minhaVez && !ocupado && !aberta && flipped.length < 2;

          return (
            <button
              key={i}
              onClick={() => podeClicar && onVirar(i)}
              disabled={!podeClicar}
              aria-label={aberta ? "Carta virada" : `Virar carta ${i + 1}`}
              className={cn(
                "relative aspect-square w-full [perspective:900px]",
                podeClicar ? "cursor-pointer" : "cursor-default"
              )}
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: aberta ? 180 : 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* costas */}
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-xl [backface-visibility:hidden]",
                    "border border-border2 bg-bg2 text-faint",
                    podeClicar && "transition-colors hover:border-text hover:text-muted"
                  )}
                >
                  <HelpCircle size={20} strokeWidth={1.5} />
                </span>

                {/* frente */}
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl",
                    "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                    casada
                      ? "border border-accent/45 bg-accent/[0.07]"
                      : "border border-border2 bg-surface"
                  )}
                >
                  <Face valor={face} />
                  {casada ? (
                    <span
                      aria-hidden
                      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                    />
                  ) : null}
                </span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Face({ valor }: { valor: string | null }) {
  if (!valor) return null;
  if (valor.startsWith("icone:")) {
    const Icone = ICONES[valor.slice(6)] ?? HelpCircle;
    return <Icone size={26} strokeWidth={1.5} className="text-accentInk" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={valor} alt="" className="h-full w-full object-cover" />;
}
