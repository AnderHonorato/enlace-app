"use client";

/**
 * Papelaria — o kit de formas da identidade do Enlace.
 *
 * A crítica que originou este arquivo: "o site não deve ter só cards, textos e
 * cores". Cor e tipografia sozinhas não fazem identidade; forma faz. Aqui moram
 * as formas próprias do Enlace — borda rasgada, selo de tinta, carimbo postal,
 * fita adesiva, grampo, margem de caderno, floreio — desenhadas à mão em SVG.
 *
 * Três regras que valem para tudo neste arquivo:
 *
 * 1. **Nada de `Math.random()`.** Estes componentes renderizam no servidor e no
 *    cliente. Um valor aleatório diferente entre os dois quebra a hidratação do
 *    React com um erro difícil de rastrear (a forma "pisca" e o console acusa
 *    mismatch). A irregularidade que faz a linha parecer feita à mão vem de
 *    `wobble()`, um hash determinístico da prop `seed`: o mesmo seed dá sempre
 *    o mesmo desenho, em qualquer ambiente.
 * 2. **Cor vem de fora.** Tudo pinta em `currentColor` ou nos tokens
 *    (`rgb(var(--accent))`), então uma forma trocada de tema acompanha sozinha.
 *    Nenhum hex cru aqui dentro.
 * 3. **Decoração é invisível para leitores de tela.** Todo SVG puramente
 *    ornamental leva `aria-hidden` e `focusable="false"`.
 */

import { cn } from "@/nucleo/utilitarios";

/* ────────────────────────────────────────────────────────────────────────────
   Irregularidade determinística

   Um gerador congruente linear pequeno. Não precisa ser bom como aleatoriedade
   — precisa ser *estável* e espalhar o suficiente para o olho não achar padrão.
   ──────────────────────────────────────────────────────────────────────────── */
function hash(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Um valor em [-amount, +amount], estável para o mesmo seed. */
function wobbler(seed: string) {
  const rnd = hash(seed);
  return (amount: number) => (rnd() - 0.5) * 2 * amount;
}

/* ────────────────────────────────────────────────────────────────────────────
   Borda rasgada

   O papel do Enlace foi arrancado de um caderno. Usada no topo de uma seção ou
   no pé de um cartão, ela é a diferença entre "um retângulo" e "uma folha".
   ──────────────────────────────────────────────────────────────────────────── */
export function BordaRasgada({
  seed = "enlace",
  height = 10,
  flip = false,
  className,
}: {
  seed?: string;
  height?: number;
  /** Vira o rasgo para baixo — use no pé de um bloco. */
  flip?: boolean;
  className?: string;
}) {
  const w = wobbler(seed);
  const teeth = 26;
  const step = 100 / teeth;
  // Dois "dentes" por passo com alturas diferentes: um rasgo real não é serra.
  let d = "M0,10 ";
  for (let i = 0; i <= teeth; i++) {
    const x = i * step;
    const y = 10 - (3.4 + w(2.6));
    d += `L${x.toFixed(2)},${Math.max(0.6, y).toFixed(2)} `;
    d += `L${(x + step / 2).toFixed(2)},${(9.4 + w(0.5)).toFixed(2)} `;
  }
  d += "L100,10 L100,0 L0,0 Z";

  return (
    <svg
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden
      focusable="false"
      className={cn("block", flip && "rotate-180", className)}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Selo de tinta

   O carimbo de cera do diário: um anel irregular com os dois círculos da marca
   no meio. É o que marca nível, conquista e memória favorita — em vez de mais
   uma pílula arredondada.
   ──────────────────────────────────────────────────────────────────────────── */
export function SeloTinta({
  size = 64,
  label,
  seed = "selo",
  className,
}: {
  size?: number;
  /** Texto curto no miolo (ex.: "7"). Sem ele, entra a marca dos dois anéis. */
  label?: string;
  seed?: string;
  className?: string;
}) {
  const w = wobbler(seed);
  // Anel montado por 44 pontos com raio trêmulo: um círculo perfeito parece
  // impresso, um trêmulo parece prensado à mão.
  const pts: string[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const r = 29 + w(1.5);
    pts.push(`${(32 + Math.cos(a) * r).toFixed(2)},${(32 + Math.sin(a) * r).toFixed(2)}`);
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label ? `Selo ${label}` : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <polygon points={pts.join(" ")} fill="rgb(var(--accent) / 0.10)" />
      <polygon
        points={pts.join(" ")}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="rgb(var(--accent) / 0.45)" strokeWidth="0.9" />
      {label ? (
        <text
          x="32"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgb(var(--accent-ink))"
          style={{
            font: `400 ${label.length > 2 ? 16 : 22}px var(--font-display), Georgia, serif`,
            letterSpacing: "-0.02em",
          }}
        >
          {label}
        </text>
      ) : (
        <g>
          <circle cx="27" cy="32" r="8" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.5" />
          <circle
            cx="37"
            cy="32"
            r="8"
            fill="rgb(var(--accent) / 0.16)"
            stroke="rgb(var(--accent))"
            strokeWidth="1.5"
          />
        </g>
      )}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Marca da IA

   O bico de pena é a assinatura de quem "escreve" no Enlace sem ser um dos
   dois — o comentário, o insight ou o resumo que a IA gera. Não é uma
   estrelinha de "mágica" nem um robozinho: é uma ponta de caneta-tinteiro, no
   mesmo vocabulário de papelaria do resto do app (selo, carimbo, fita).
   Precisa ser inconfundível com o avatar de uma pessoa (círculo com iniciais
   ou foto) e com os personagens ilustrados (`CharacterAvatar`) — aqui não há
   rosto, só a marca de quem escreveu.

   `AiMark` é só o glifo (drop-in no lugar de um ícone lucide, ex. `Sparkles`)
   para usar dentro de um círculo/badge que o card já desenha. `AiSeal` é o
   selo completo — glifo + anel — para quando não existe nenhum contêiner ao
   redor e a marca precisa se bastar sozinha (ex. crachá sobre um avatar).
   ──────────────────────────────────────────────────────────────────────────── */
function NibGlyph() {
  return (
    <>
      <path
        d="M12 2.6c3.4 3.5 5.8 7.3 5.8 10.5a5.8 5.8 0 1 1-11.6 0c0-3.2 2.4-7 5.8-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 8.4v9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="5.7" r="1.05" fill="currentColor" />
    </>
  );
}

/** O glifo sozinho — drop-in no lugar de um ícone dentro de um badge/círculo já existente. */
export function AiMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <NibGlyph />
    </svg>
  );
}

/** O selo completo (anel + glifo) — quando a marca precisa se bastar sozinha, sem contêiner ao redor. */
export function AiSeal({
  size = 32,
  label = "Resposta da IA",
  className,
}: {
  size?: number;
  label?: string | null;
  className?: string;
}) {
  const w = wobbler("ai-seal");
  const pts: string[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 29 + w(1.4);
    pts.push(`${(32 + Math.cos(a) * r).toFixed(2)},${(32 + Math.sin(a) * r).toFixed(2)}`);
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <polygon points={pts.join(" ")} fill="currentColor" opacity="0.14" />
      <polygon points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <g transform="translate(20.5,21) scale(0.9)">
        <NibGlyph />
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Carimbo postal

   O diário é correspondência entre duas pessoas — daí o vocabulário postal.
   Este é o carimbo redondo de data, com as ondas de cancelamento.
   ──────────────────────────────────────────────────────────────────────────── */
export function CarimboPostal({
  size = 84,
  top = "ENLACE",
  middle,
  bottom,
  seed = "carimbo",
  className,
}: {
  size?: number;
  top?: string;
  /** Linha central — normalmente o dia. */
  middle: string;
  /** Linha de baixo — normalmente mês e ano. */
  bottom?: string;
  seed?: string;
  className?: string;
}) {
  const w = wobbler(seed);
  const rot = w(6);

  return (
    <svg
      viewBox="0 0 84 84"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ transform: `rotate(${rot.toFixed(2)}deg)` }}
      role="img"
      aria-label={[top, middle, bottom].filter(Boolean).join(" ")}
      focusable="false"
    >
      <circle cx="42" cy="42" r="38" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.75" />
      <circle cx="42" cy="42" r="31" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <path id={`arc-${seed}`} d="M42,42 m-24,0 a24,24 0 0,1 48,0" fill="none" />
      <text
        fill="currentColor"
        opacity="0.8"
        style={{ font: "700 8px var(--font-body), system-ui", letterSpacing: "0.22em" }}
      >
        <textPath href={`#arc-${seed}`} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text
        x="42"
        y="43"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{ font: "400 21px var(--font-display), Georgia, serif", letterSpacing: "-0.02em" }}
      >
        {middle}
      </text>
      {bottom ? (
        <text
          x="42"
          y="59"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.75"
          style={{ font: "700 7.5px var(--font-body), system-ui", letterSpacing: "0.2em" }}
        >
          {bottom.toUpperCase()}
        </text>
      ) : null}
      {/* ondas de cancelamento */}
      <g opacity="0.45" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d={`M6,${(26 + w(1)).toFixed(1)} q9,-3 18,0 t18,0`} />
        <path d={`M6,${(58 + w(1)).toFixed(1)} q9,3 18,0 t18,0`} />
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Fita adesiva

   Prende foto e cartão na página. Meio translúcida, com as pontas irregulares.
   ──────────────────────────────────────────────────────────────────────────── */
export function Fita({
  width = 92,
  seed = "fita",
  className,
}: {
  width?: number;
  seed?: string;
  className?: string;
}) {
  const w = wobbler(seed);
  const rot = w(5);
  return (
    <svg
      viewBox="0 0 92 28"
      width={width}
      height={(width / 92) * 28}
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rot.toFixed(2)}deg)` }}
    >
      <path
        d={`M${(4 + w(2)).toFixed(1)},4 L88,${(2 + w(1.5)).toFixed(1)} L${(89 + w(1)).toFixed(
          1
        )},24 L3,${(26 + w(1.5)).toFixed(1)} Z`}
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d={`M${(4 + w(2)).toFixed(1)},4 L88,${(2 + w(1.5)).toFixed(1)}`}
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.3"
        fill="none"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Floreio

   Um traço de caneta que separa dois blocos. Substitui a régua reta quando o
   momento pede respiro em vez de estrutura — fim de memória, fim de capítulo.
   ──────────────────────────────────────────────────────────────────────────── */
export function Floreio({
  width = 120,
  seed = "floreio",
  className,
}: {
  width?: number;
  seed?: string;
  className?: string;
}) {
  const w = wobbler(seed);
  return (
    <svg
      viewBox="0 0 120 16"
      width={width}
      height={(width / 120) * 16}
      aria-hidden
      focusable="false"
      className={cn("text-border2", className)}
    >
      <path
        d={`M2,8 C${(22 + w(4)).toFixed(1)},${(2 + w(2)).toFixed(1)} ${(40 + w(4)).toFixed(1)},${(
          14 + w(2)
        ).toFixed(1)} 60,8 C${(80 + w(4)).toFixed(1)},${(2 + w(2)).toFixed(1)} ${(98 + w(4)).toFixed(
          1
        )},${(14 + w(2)).toFixed(1)} 118,8`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="8" r="2.1" fill="rgb(var(--accent))" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Folha

   O contêiner com identidade: uma folha de caderno com margem vermelha à
   esquerda, canto dobrado e, opcionalmente, borda rasgada no pé. Onde antes
   havia `.card`, aqui há papel.
   ──────────────────────────────────────────────────────────────────────────── */
export function Folha({
  children,
  seed = "folha",
  margem = true,
  dobra = true,
  rasgo = false,
  className,
}: {
  children: React.ReactNode;
  seed?: string;
  /** A linha de margem vermelha do caderno. */
  margem?: boolean;
  /** O canto dobrado no topo à direita. */
  dobra?: boolean;
  /** Borda rasgada no pé da folha. */
  rasgo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-surface text-text shadow-card",
        // O canto dobrado é feito com clip-path, não com um pseudo-elemento
        // sobreposto: assim a dobra recorta a folha de verdade e o fundo da
        // página aparece por baixo, em vez de um triângulo pintado por cima
        // que denunciaria a cor errada sobre foto de fundo.
        dobra
          ? "[clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]"
          : "rounded-2xl border border-border2",
        className
      )}
    >
      {dobra ? (
        <>
          {/* A sombra da dobra, desenhada no mesmo canto que o clip abriu. */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-[18px] w-[18px] bg-border2 [clip-path:polygon(0_0,100%_100%,0_100%)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-border2 [clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]"
          />
        </>
      ) : null}

      {margem ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[34px] w-px bg-accent/25"
        />
      ) : null}

      {children}

      {rasgo ? (
        <BordaRasgada seed={seed} flip className="absolute inset-x-0 bottom-0 text-bg" />
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Etiqueta

   O rótulo costurado do caderno: um retângulo com as pontas chanfradas e um
   furo, para categoria, humor e tag em destaque.
   ──────────────────────────────────────────────────────────────────────────── */
export function Etiqueta({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: "ink" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-2 py-1 pl-5 pr-3 text-[11.5px] font-semibold",
        // As pontas chanfradas dão à etiqueta uma silhueta que nenhuma pílula
        // arredondada tem — é a forma, não a cor, que a diferencia.
        "[clip-path:polygon(8px_0,100%_0,100%_100%,8px_100%,0_50%)]",
        tone === "accent" ? "bg-accent/12 text-accentInk" : "bg-bg2 text-muted",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-[10px] h-[5px] w-[5px] rounded-full",
          tone === "accent" ? "bg-accent/50" : "bg-border2"
        )}
      />
      {children}
    </span>
  );
}
