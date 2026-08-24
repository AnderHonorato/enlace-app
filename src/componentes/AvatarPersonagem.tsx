import { cn } from "@/nucleo/utilitarios";

// Ilustrações vetoriais dos personagens de IA do Amora.

export function CharacterAvatar({
  slug,
  size = 96,
  className,
  float,
  animated = true,
}: {
  slug: string;
  size?: number;
  className?: string;
  float?: boolean;
  animated?: boolean;
}) {
  const Art = ART[slug] ?? ART.lua;
  return (
    <span
      className={cn("inline-block", float && "animate-float", animated && "char-anim", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} role="img">
        <Art />
      </svg>
    </span>
  );
}

const eyeSleep = (x: number, y: number) => (
  <path d={`M${x - 5} ${y} q5 5 10 0`} stroke="#3a2b4d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
);
const eyeDot = (x: number, y: number, c = "#3a2b4d") => <circle className="eye" cx={x} cy={y} r="3.1" fill={c} />;
const blush = (x: number, y: number, c: string) => <ellipse cx={x} cy={y} rx="5" ry="3.2" fill={c} opacity="0.5" />;

const ART: Record<string, () => JSX.Element> = {
  lua: () => (
    <>
      <defs>
        <radialGradient id="lua-bg" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#312a52" />
          <stop offset="1" stopColor="#221c39" />
        </radialGradient>
        <linearGradient id="lua-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EDE6FF" />
          <stop offset="1" stopColor="#C9B8F5" />
        </linearGradient>
        <mask id="lua-cres">
          <rect width="120" height="120" fill="black" />
          <circle cx="56" cy="62" r="34" fill="white" />
          <circle cx="74" cy="52" r="30" fill="black" />
        </mask>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#lua-bg)" />
      <circle className="twinkle" cx="92" cy="34" r="2.4" fill="#fff" opacity="0.9" />
      <circle className="twinkle" cx="100" cy="52" r="1.6" fill="#fff" opacity="0.7" />
      <circle className="twinkle" cx="30" cy="30" r="1.8" fill="#fff" opacity="0.7" />
      <g mask="url(#lua-cres)">
        <rect width="120" height="120" fill="url(#lua-moon)" />
      </g>
      {eyeSleep(46, 62)}
      {eyeSleep(62, 60)}
      <path d="M50 74 q6 5 12 0" stroke="#3a2b4d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {blush(44, 70, "#E5679B")}
      {blush(66, 68, "#E5679B")}
    </>
  ),
  sol: () => (
    <>
      <defs>
        <radialGradient id="sol-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#3a2a1c" />
          <stop offset="1" stopColor="#2a1e15" />
        </radialGradient>
        <radialGradient id="sol-face" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#FFD766" />
          <stop offset="1" stopColor="#FF922B" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#sol-bg)" />
      <g fill="#FFC24D">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x = 60 + Math.cos(a) * 44;
          const y = 60 + Math.sin(a) * 44;
          return <circle className="twinkle" key={i} cx={x} cy={y} r="4.5" opacity="0.9" />;
        })}
      </g>
      <circle cx="60" cy="60" r="33" fill="url(#sol-face)" />
      {eyeDot(50, 56, "#5a3410")}
      {eyeDot(70, 56, "#5a3410")}
      <path d="M49 68 q11 12 22 0" stroke="#5a3410" strokeWidth="3" strokeLinecap="round" fill="none" />
      {blush(46, 66, "#E8623C")}
      {blush(74, 66, "#E8623C")}
    </>
  ),
  cupido: () => (
    <>
      <defs>
        <radialGradient id="cup-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#3d2130" />
          <stop offset="1" stopColor="#2c1723" />
        </radialGradient>
        <linearGradient id="cup-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F48FB1" />
          <stop offset="1" stopColor="#E5679B" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#cup-bg)" />
      <g fill="#F6D2E4" opacity="0.95">
        <path d="M40 58 q-22 -12 -30 4 q16 6 30 6 z" />
        <path d="M80 58 q22 -12 30 4 q-16 6 -30 6 z" />
      </g>
      <path
        fill="url(#cup-heart)"
        d="M60 92c-2 0-4-1-5-2l-27-27c-9-9-9-24 0-33 8-8 21-8 30 0l2 2 2-2c9-8 22-8 30 0 9 9 9 24 0 33l-27 27c-1 1-3 2-5 2z"
      />
      <path d="M49 58 q4 4 8 0" stroke="#7a2f4d" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {eyeDot(70, 58, "#7a2f4d")}
      <path d="M55 72 q5 4 10 0" stroke="#7a2f4d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {blush(48, 68, "#C63f6a")}
      {blush(72, 68, "#C63f6a")}
    </>
  ),
  nino: () => (
    <>
      <defs>
        <radialGradient id="nino-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#1c3a37" />
          <stop offset="1" stopColor="#152b29" />
        </radialGradient>
        <linearGradient id="nino-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66CFC0" />
          <stop offset="1" stopColor="#3FA99A" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#nino-bg)" />
      <path d="M40 40 l6 -14 8 12 z" fill="#3FA99A" />
      <path d="M80 40 l-6 -14 -8 12 z" fill="#3FA99A" />
      <ellipse cx="60" cy="64" rx="34" ry="36" fill="url(#nino-body)" />
      <ellipse cx="60" cy="80" rx="18" ry="20" fill="#D7F3ED" opacity="0.5" />
      <circle cx="49" cy="56" r="14" fill="#fff" />
      <circle cx="71" cy="56" r="14" fill="#fff" />
      <circle cx="49" cy="56" r="13.5" fill="none" stroke="#2b6f65" strokeWidth="2.2" />
      <circle cx="71" cy="56" r="13.5" fill="none" stroke="#2b6f65" strokeWidth="2.2" />
      <line x1="61" y1="54" x2="59" y2="54" stroke="#2b6f65" strokeWidth="2.2" />
      {eyeDot(50, 57, "#243b39")}
      {eyeDot(70, 57, "#243b39")}
      <path d="M56 72 l4 5 4 -5 z" fill="#F2A65A" />
    </>
  ),
  bel: () => (
    <>
      <defs>
        <radialGradient id="bel-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#3a2320" />
          <stop offset="1" stopColor="#2a1a18" />
        </radialGradient>
        <radialGradient id="bel-center" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#FFE1A8" />
          <stop offset="1" stopColor="#FFC04D" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#bel-bg)" />
      <g fill="#F4726A">
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i * 2 * Math.PI) / 7 - Math.PI / 2;
          const x = 60 + Math.cos(a) * 26;
          const y = 60 + Math.sin(a) * 26;
          return <ellipse key={i} cx={x} cy={y} rx="13" ry="17" transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} opacity="0.95" />;
        })}
      </g>
      <circle cx="60" cy="60" r="22" fill="url(#bel-center)" />
      {eyeDot(53, 58, "#7a4a1a")}
      {eyeDot(67, 58, "#7a4a1a")}
      <path d="M54 66 q6 5 12 0" stroke="#7a4a1a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {blush(50, 63, "#F4726A")}
      {blush(70, 63, "#F4726A")}
    </>
  ),

  // ── Cora: um livro aberto, a memorialista ──
  cora: () => (
    <>
      <defs>
        <radialGradient id="cora-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#3b2c20" />
          <stop offset="1" stopColor="#291f17" />
        </radialGradient>
        <linearGradient id="cora-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6E6" />
          <stop offset="1" stopColor="#EBD9BC" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#cora-bg)" />
      {/* páginas soltas voando */}
      <g fill="#F6E7CC" opacity="0.5">
        <rect className="twinkle" x="18" y="24" width="12" height="9" rx="1.5" transform="rotate(-18 24 28)" />
        <rect className="twinkle" x="92" y="30" width="10" height="8" rx="1.5" transform="rotate(14 97 34)" />
      </g>
      {/* capa */}
      <path d="M26 46 q34 -12 68 0 v40 q-34 -10 -68 0 z" fill="#C08A5E" />
      {/* folhas */}
      <path d="M30 49 q28 -9 28 -2 v34 q0 -6 -28 3 z" fill="url(#cora-page)" />
      <path d="M90 49 q-28 -9 -28 -2 v34 q0 -6 28 3 z" fill="url(#cora-page)" />
      <line x1="60" y1="47" x2="60" y2="86" stroke="#8E6440" strokeWidth="2.2" />
      {/* linhas de texto */}
      <g stroke="#C4A87E" strokeWidth="1.6" strokeLinecap="round">
        <line x1="36" y1="58" x2="54" y2="55" />
        <line x1="36" y1="65" x2="54" y2="62" />
        <line x1="66" y1="55" x2="84" y2="58" />
        <line x1="66" y1="62" x2="84" y2="65" />
      </g>
      {/* rosto no alto da capa */}
      {eyeDot(50, 36, "#EBD9BC")}
      {eyeDot(70, 36, "#EBD9BC")}
      <path d="M54 42 q6 5 12 0" stroke="#EBD9BC" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </>
  ),

  // ── Vitto: bússola/mapa, o parceiro de planos ──
  vitto: () => (
    <>
      <defs>
        <radialGradient id="vitto-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#1d2f47" />
          <stop offset="1" stopColor="#152233" />
        </radialGradient>
        <linearGradient id="vitto-dial" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CFE4FA" />
          <stop offset="1" stopColor="#8FBDF0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#vitto-bg)" />
      {/* rota pontilhada */}
      <path
        d="M14 92 q22 -16 34 -4 t26 -10 t32 -12"
        stroke="#5AA0F0"
        strokeWidth="2.4"
        strokeDasharray="4 5"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <circle className="twinkle" cx="104" cy="66" r="3.4" fill="#8FE3C8" />
      {/* corpo da bússola */}
      <circle cx="60" cy="58" r="34" fill="#3E6FA8" />
      <circle cx="60" cy="58" r="28" fill="url(#vitto-dial)" />
      <g stroke="#3E6FA8" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <line x1="60" y1="34" x2="60" y2="39" />
        <line x1="60" y1="77" x2="60" y2="82" />
        <line x1="36" y1="58" x2="41" y2="58" />
        <line x1="79" y1="58" x2="84" y2="58" />
      </g>
      {/* agulha */}
      <path d="M60 40 l7 18 -7 -4 -7 4 z" fill="#F4726A" />
      <path d="M60 76 l-7 -18 7 4 7 -4 z" fill="#2C4A70" opacity="0.75" />
      <circle cx="60" cy="58" r="3.4" fill="#2C4A70" />
      {eyeDot(50, 52, "#2C4A70")}
      {eyeDot(70, 52, "#2C4A70")}
      {blush(46, 62, "#5AA0F0")}
      {blush(74, 62, "#5AA0F0")}
    </>
  ),

  // ── Juno: carta de baralho, a provocadora ──
  juno: () => (
    <>
      <defs>
        <radialGradient id="juno-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#2f2350" />
          <stop offset="1" stopColor="#211a3a" />
        </radialGradient>
        <linearGradient id="juno-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1EAFF" />
          <stop offset="1" stopColor="#D6C6F7" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#juno-bg)" />
      <circle className="twinkle" cx="26" cy="34" r="2" fill="#fff" opacity="0.7" />
      <circle className="twinkle" cx="96" cy="86" r="2.4" fill="#fff" opacity="0.6" />
      {/* cartas de trás */}
      <rect x="30" y="30" width="48" height="64" rx="7" fill="#8B5CD6" opacity="0.55" transform="rotate(-14 54 62)" />
      <rect x="42" y="28" width="48" height="64" rx="7" fill="#A47BE8" opacity="0.7" transform="rotate(8 66 60)" />
      {/* carta da frente */}
      <rect x="36" y="26" width="48" height="66" rx="7" fill="url(#juno-card)" />
      <rect x="36" y="26" width="48" height="66" rx="7" fill="none" stroke="#8B5CD6" strokeWidth="1.8" />
      {/* interrogação */}
      <path
        d="M52 48 q0 -9 8 -9 q8 0 8 8 q0 6 -7 8 v5"
        stroke="#7A4BC4"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="61" cy="72" r="2.8" fill="#7A4BC4" />
      {eyeDot(46, 84, "#7A4BC4")}
      {eyeDot(74, 84, "#7A4BC4")}
    </>
  ),

  // ── Mel: folha/gota, a calmante ──
  mel: () => (
    <>
      <defs>
        <radialGradient id="mel-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#1b3a36" />
          <stop offset="1" stopColor="#132a27" />
        </radialGradient>
        <linearGradient id="mel-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FE3C8" />
          <stop offset="1" stopColor="#4ABEB0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#mel-bg)" />
      {/* ondas concêntricas de respiração */}
      <g fill="none" stroke="#4ABEB0" strokeWidth="1.6">
        <circle className="twinkle" cx="60" cy="62" r="46" opacity="0.25" />
        <circle className="twinkle" cx="60" cy="62" r="38" opacity="0.35" />
      </g>
      {/* folha */}
      <path d="M60 26 q26 20 26 42 q0 20 -26 26 q-26 -6 -26 -26 q0 -22 26 -42 z" fill="url(#mel-leaf)" />
      <path
        d="M60 32 v54"
        stroke="#2E8A7E"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <g stroke="#2E8A7E" strokeWidth="1.5" strokeLinecap="round" opacity="0.45">
        <line x1="60" y1="48" x2="48" y2="42" />
        <line x1="60" y1="58" x2="72" y2="52" />
        <line x1="60" y1="68" x2="48" y2="62" />
      </g>
      {eyeSleep(50, 60)}
      {eyeSleep(70, 60)}
      <path d="M54 70 q6 4 12 0" stroke="#22625a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {blush(46, 66, "#2E8A7E")}
      {blush(74, 66, "#2E8A7E")}
    </>
  ),

  // ── Tino: máscara de teatro, o comediante ──
  tino: () => (
    <>
      <defs>
        <radialGradient id="tino-bg" cx="0.5" cy="0.4">
          <stop offset="0" stopColor="#3d3320" />
          <stop offset="1" stopColor="#2b2417" />
        </radialGradient>
        <linearGradient id="tino-mask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFDC96" />
          <stop offset="1" stopColor="#E0A84A" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#tino-bg)" />
      {/* confete */}
      <g opacity="0.8">
        <rect className="twinkle" x="22" y="28" width="5" height="5" rx="1" fill="#F4726A" transform="rotate(20 24 30)" />
        <rect className="twinkle" x="94" y="40" width="5" height="5" rx="1" fill="#5AA0F0" transform="rotate(-25 96 42)" />
        <rect className="twinkle" x="28" y="90" width="5" height="5" rx="1" fill="#8FE3C8" transform="rotate(35 30 92)" />
      </g>
      {/* máscara triste, atrás */}
      <path d="M32 40 q-8 30 6 44 q10 10 18 2 q-14 -20 -6 -46 z" fill="#B8862F" opacity="0.75" />
      {/* máscara alegre, na frente */}
      <path
        d="M60 28 q30 0 30 28 q0 30 -30 40 q-30 -10 -30 -40 q0 -28 30 -28 z"
        fill="url(#tino-mask)"
      />
      {/* olhos vazados da máscara */}
      <ellipse cx="49" cy="56" rx="6" ry="7.5" fill="#3d3320" />
      <ellipse cx="71" cy="56" rx="6" ry="7.5" fill="#3d3320" />
      {/* sobrancelhas levantadas */}
      <g stroke="#9A6C22" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M42 45 q7 -5 13 -1" />
        <path d="M78 45 q-7 -5 -13 -1" />
      </g>
      {/* riso largo */}
      <path d="M45 70 q15 18 30 0 q-15 8 -30 0 z" fill="#3d3320" />
      {blush(41, 64, "#F4726A")}
      {blush(79, 64, "#F4726A")}
    </>
  ),
};
