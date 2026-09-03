import { cn } from "@/nucleo/utilitarios";
import { BRAND } from "@/nucleo/marca";

/**
 * Símbolo Enlace 2026: dois corações sobrepostos como duas memórias que
 * continuam individuais, mas passam a formar uma terceira área em comum.
 * O desenho é vetorial, leve e funciona do favicon ao cabeçalho do app.
 */
export function HeartMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="enlace-heart-a" x1="5" y1="5" x2="28" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--enlace-rosa-claro))" />
          <stop offset="1" stopColor="rgb(var(--accent))" />
        </linearGradient>
        <linearGradient id="enlace-heart-b" x1="15" y1="7" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--accent-2))" />
          <stop offset="1" stopColor="rgb(var(--enlace-ameixa))" />
        </linearGradient>
      </defs>
      <path
        d="M19.6 33.4C17.4 31.4 8.1 24.7 5.7 19.4C2.7 12.8 6.3 7.1 12.1 7.1C15.3 7.1 17.7 8.9 19.6 11.3C21.4 8.9 23.8 7.1 27 7.1C32.8 7.1 36.4 12.8 33.4 19.4C31 24.7 21.7 31.4 19.6 33.4Z"
        fill="url(#enlace-heart-a)"
        opacity="0.96"
      />
      <path
        d="M25.4 34.2C23.8 32.8 17.5 28.1 15.7 24.2C13.5 19.4 16.1 15.2 20.4 15.2C22.7 15.2 24.3 16.4 25.4 18.1C26.7 16.4 28.3 15.2 30.6 15.2C34.8 15.2 37.4 19.4 35.2 24.2C33.4 28.1 27.1 32.8 25.4 34.2Z"
        fill="url(#enlace-heart-b)"
        opacity="0.86"
      />
      <path
        d="M19.6 11.3C21.4 8.9 23.8 7.1 27 7.1C29.7 7.1 31.9 8.4 33.3 10.4"
        stroke="rgb(255 255 255 / .34)"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="inline-grid place-items-center rounded-[30%] border border-accent/15 bg-bg/70 p-[3px] shadow-soft"
        style={{ width: size + 8, height: size + 8 }}
      >
        <HeartMark size={size} />
      </span>
      <span
        className="font-display font-medium italic leading-none tracking-[-0.045em] text-text"
        style={{ fontSize: Math.round(size * 0.9) }}
      >
        {BRAND}
      </span>
    </span>
  );
}
