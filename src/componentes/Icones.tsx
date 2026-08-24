// Ícones próprios do Enlace.
//
// Emoji é desenho do sistema operacional: o mesmo ❤️ é vermelho-chapado no
// Windows, arredondado no iPhone e outra coisa no Android. Isso faz o app
// parecer emprestado — e num diário de casal, o que aparece na tela é parte da
// intimidade da coisa. Estes são desenhados com o mesmo vocabulário: traço
// arredondado de peso constante, cantos macios, e coração sempre que couber.
//
// Todos herdam a cor do texto (`currentColor`), então funcionam em qualquer
// tema e em qualquer fundo sem precisar de variante.
//
// IMPORTANTE: emoji que é CONTEÚDO não entra aqui. No Quiz de Filme o emoji é
// o próprio enigma, no Wordle são as categorias, e o humor de cada memória é
// escolha da pessoa. Trocar aqueles quebraria o significado.

type IconProps = {
  size?: number;
  className?: string;
  /** Espessura do traço. O padrão combina com texto corrido. */
  weight?: number;
};

export function Svg({
  size = 20,
  className,
  weight = 1.9,
  children,
  filled,
}: IconProps & { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ── Afeto ───────────────────────────────────────────────────────────────── */

export function IconCoracao({ filled = true, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p} filled={filled}>
      <path d="M12 20.5 4.6 13.4a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 0 1 6.6 6.7Z" />
    </Svg>
  );
}

/** Dois corações entrelaçados — o "nós" do casal. */
export function IconCoracoes(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.5 18.5 4 13.2a3.6 3.6 0 0 1 5.1-5.1l.4.4.4-.4a3.6 3.6 0 0 1 5.1 5.1Z" />
      <path d="M14.8 6.2a3.4 3.4 0 0 1 4.8 4.8l-2.1 2" opacity="0.55" />
    </Svg>
  );
}

export function IconCartinha(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.6" />
      <path d="M3.6 7 12 13l8.4-6" />
      <path d="M12 16.6c1.4-1.3 2.6-2.1 2.6-3.2a1.3 1.3 0 0 0-2.6-.5 1.3 1.3 0 0 0-2.6.5c0 1.1 1.2 1.9 2.6 3.2Z" opacity="0.6" />
    </Svg>
  );
}

export function IconPresente(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="10" width="17" height="10.5" rx="2" />
      <path d="M2.5 7h19v3h-19z" />
      <path d="M12 7v13.5" />
      <path d="M12 7c-1.6 0-3.4-.6-3.4-2.2A1.8 1.8 0 0 1 12 4.4a1.8 1.8 0 0 1 3.4.4C15.4 6.4 13.6 7 12 7Z" />
    </Svg>
  );
}

/* ── Conquista e progresso ───────────────────────────────────────────────── */

export function IconTrofeu(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0Z" />
      <path d="M7 5.5H4.5v1.8A3.2 3.2 0 0 0 7 10.4" />
      <path d="M17 5.5h2.5v1.8a3.2 3.2 0 0 1-2.5 3.1" />
      <path d="M12 14.5V18" />
      <path d="M8.5 20.5h7" />
    </Svg>
  );
}

export function IconCoroa(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 17.5 3 7.5l4.6 3.6L12 5l4.4 6.1L21 7.5l-1 10Z" />
      <path d="M4.6 20.5h14.8" />
    </Svg>
  );
}

export function IconEstrela({ filled = false, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p} filled={filled}>
      <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z" />
    </Svg>
  );
}

/** Brilho de quatro pontas — o "algo especial" do app. */
export function IconBrilho(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5c.6 4 1.9 5.3 5.9 5.9-4 .6-5.3 1.9-5.9 5.9-.6-4-1.9-5.3-5.9-5.9 4-.6 5.3-1.9 5.9-5.9Z" />
      <path d="M18 16c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z" opacity="0.6" />
    </Svg>
  );
}

export function IconChama(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21c3.6 0 6-2.3 6-5.4 0-3.9-3.6-5.3-3.1-9.6-2 .8-3.2 2.4-3.4 4.3-1-.7-1.4-1.8-1.3-3.1C8.1 8.6 6 11 6 15.6 6 18.7 8.4 21 12 21Z" />
      <path d="M12 21c1.6 0 2.7-1.1 2.7-2.6 0-1.7-1.7-2.5-1.5-4.6-1.6.9-2.4 2.2-2.4 3.8 0 2 .8 3.4 1.2 3.4Z" opacity="0.55" />
    </Svg>
  );
}

export function IconAlvo(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.3" />
      <circle cx="12" cy="12" r="4.6" opacity="0.7" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconFesta(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 20.5 8 9.2l6.8 6.8Z" />
      <path d="M13.2 3.6c1 1 1 2.2 0 3.2M17 5.4c1.5 1.5 1.5 3.2 0 4.7M20.4 10.6c.9.9.9 2 0 2.9" opacity="0.7" />
      <circle cx="19.6" cy="4.6" r="1" fill="currentColor" stroke="none" opacity="0.8" />
      <circle cx="10.4" cy="4.4" r="0.9" fill="currentColor" stroke="none" opacity="0.6" />
    </Svg>
  );
}

/* ── Lugar e tempo ───────────────────────────────────────────────────────── */

export function IconLugar(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21c4.2-4.6 6.3-7.7 6.3-10.6A6.3 6.3 0 0 0 5.7 10.4C5.7 13.3 7.8 16.4 12 21Z" />
      <path d="M12 12.9c1-1 1.9-1.6 1.9-2.5a1 1 0 0 0-1.9-.4 1 1 0 0 0-1.9.4c0 .9.9 1.5 1.9 2.5Z" opacity="0.65" />
    </Svg>
  );
}

export function IconMapa(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8Z" />
      <path d="M9 4.5v12.7M15 6.8v12.7" opacity="0.6" />
    </Svg>
  );
}

export function IconAmpulheta(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 3h11M6.5 21h11" />
      <path d="M7.5 3v3.4c0 2 4.5 3.6 4.5 5.6s-4.5 3.6-4.5 5.6V21" />
      <path d="M16.5 3v3.4c0 2-4.5 3.6-4.5 5.6s4.5 3.6 4.5 5.6V21" />
    </Svg>
  );
}

export function IconCalendario(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" />
      <path d="M3.5 9.6h17M8.2 3v4M15.8 3v4" />
      <path d="M12 15.5c.9-.8 1.7-1.3 1.7-2.2a.9.9 0 0 0-1.7-.3.9.9 0 0 0-1.7.3c0 .9.8 1.4 1.7 2.2Z" opacity="0.6" />
    </Svg>
  );
}

/* ── Natureza e bichinho ─────────────────────────────────────────────────── */

export function IconPatinha(p: IconProps) {
  return (
    <Svg {...p} filled>
      <ellipse cx="12" cy="16.2" rx="4.4" ry="3.6" />
      <ellipse cx="6.6" cy="11.4" rx="2.1" ry="2.6" />
      <ellipse cx="17.4" cy="11.4" rx="2.1" ry="2.6" />
      <ellipse cx="9.4" cy="6.8" rx="1.9" ry="2.4" />
      <ellipse cx="14.6" cy="6.8" rx="1.9" ry="2.4" />
    </Svg>
  );
}

export function IconFlor(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.6" r="2.5" />
      <circle cx="7.6" cy="11.8" r="2.5" />
      <circle cx="16.4" cy="11.8" r="2.5" />
      <circle cx="9.3" cy="16.6" r="2.5" opacity="0.75" />
      <circle cx="14.7" cy="16.6" r="2.5" opacity="0.75" />
      <circle cx="12" cy="12.6" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconLua(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 14.4A8.3 8.3 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z" />
    </Svg>
  );
}

/* ── Objetos do app ──────────────────────────────────────────────────────── */

export function IconLivro(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.8 4.6h5.4A2.8 2.8 0 0 1 12 7.4v12.2a2.4 2.4 0 0 0-2.4-2.2H3.8Z" />
      <path d="M20.2 4.6h-5.4A2.8 2.8 0 0 0 12 7.4v12.2a2.4 2.4 0 0 1 2.4-2.2h5.8Z" />
    </Svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.8" y="6.8" width="18.4" height="13" rx="3" />
      <path d="M8.6 6.8 10 4.2h4l1.4 2.6" />
      <circle cx="12" cy="13.4" r="3.6" />
    </Svg>
  );
}

export function IconRadio(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.8" y="8" width="18.4" height="12" rx="2.6" />
      <path d="m7.4 8 9.6-4" />
      <circle cx="8.4" cy="14" r="2.8" />
      <path d="M14 12.4h4M14 16h4" opacity="0.7" />
    </Svg>
  );
}

export function IconEscudo(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.2 4.8 6v6.2c0 4.2 3 7.3 7.2 8.6 4.2-1.3 7.2-4.4 7.2-8.6V6Z" />
      <path d="M12 14.4c1.2-1.1 2.2-1.8 2.2-2.9a1.2 1.2 0 0 0-2.2-.5 1.2 1.2 0 0 0-2.2.5c0 1.1 1 1.8 2.2 2.9Z" opacity="0.65" />
    </Svg>
  );
}

export function IconBussola(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8Z" />
    </Svg>
  );
}

export function IconInfinito(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8.4 8.6a3.4 3.4 0 1 0 0 6.8c2.6 0 4.6-6.8 7.2-6.8a3.4 3.4 0 1 1 0 6.8c-2.6 0-4.6-6.8-7.2-6.8Z" />
    </Svg>
  );
}

/* ── Marcas de interface ─────────────────────────────────────────────────── */

export function IconCerto(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m4.8 12.6 4.6 4.6L19.2 7.4" />
    </Svg>
  );
}

export function IconBalao(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.5 12.2c0 3.9-3.8 7-8.5 7-1 0-2-.2-2.9-.4L4 20.5l1.5-3.6a6.5 6.5 0 0 1-2-4.7c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z" />
    </Svg>
  );
}

export function IconCadeado(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.6" />
      <path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.6" />
    </Svg>
  );
}

/* ── Carinhas do bichinho ────────────────────────────────────────────────── */

/** Estado de ânimo do gatinho, no lugar de 😻 / 🙂 / 🥺. */
export function IconCarinha({ estado = "feliz", ...p }: IconProps & { estado?: "amado" | "feliz" | "carente" }) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.6" />
      {estado === "amado" ? (
        <>
          <path d="M6.9 10.4c.7-.8 1.4-1.2 1.4-1.9a.7.7 0 0 0-1.4-.3.7.7 0 0 0-1.4.3c0 .7.7 1.1 1.4 1.9Z" fill="currentColor" stroke="none" />
          <path d="M17.1 10.4c.7-.8 1.4-1.2 1.4-1.9a.7.7 0 0 0-1.4-.3.7.7 0 0 0-1.4.3c0 .7.7 1.1 1.4 1.9Z" fill="currentColor" stroke="none" />
          <path d="M8.6 14.4a4.4 4.4 0 0 0 6.8 0" />
        </>
      ) : estado === "carente" ? (
        <>
          <path d="M8.4 11.4h.02M15.6 11.4h.02" strokeWidth="2.4" />
          <path d="M9.2 16.4a3.8 3.8 0 0 1 5.6 0" />
          <path d="M6.6 9.2a3 3 0 0 1 2.6-1M17.4 9.2a3 3 0 0 0-2.6-1" opacity="0.6" />
        </>
      ) : (
        <>
          <path d="M8.4 10.6h.02M15.6 10.6h.02" strokeWidth="2.4" />
          <path d="M8.8 14.6a4 4 0 0 0 6.4 0" />
        </>
      )}
    </Svg>
  );
}
