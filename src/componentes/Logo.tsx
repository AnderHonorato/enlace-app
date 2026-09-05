import { cn } from "@/nucleo/utilitarios";
import { BRAND } from "@/nucleo/marca";

/** Símbolo principal: dois corações que se sobrepõem e formam um enlace. */
export function HeartMark({ size = 28, className }: { size?: number; className?: string }) {
  const gradientId = `enlace-coracao-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="7" y1="7" x2="34" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--brand-rose))" />
          <stop offset="1" stopColor="rgb(var(--brand-plum))" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="39" height="39" rx="11.5" fill="rgb(var(--brand-navy))" />
      <rect x="1.5" y="1.5" width="39" height="39" rx="11.5" stroke="rgb(var(--brand-blush) / .16)" />
      <path
        d="M10.1 14.7c0-4 3.2-7.2 7.1-7.2 2.4 0 4.6 1.2 5.9 3.1 1.3-1.9 3.4-3.1 5.9-3.1 3.9 0 7 3.2 7 7.2 0 7.5-12.9 14.7-12.9 14.7S10.1 22.2 10.1 14.7Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M14.7 21.3c0-3.3 2.6-5.9 5.8-5.9 2 0 3.8 1 4.9 2.5a5.84 5.84 0 0 1 4.8-2.5c3.2 0 5.8 2.6 5.8 5.9 0 6.1-10.6 12-10.6 12s-10.7-5.9-10.7-12Z"
        fill="rgb(var(--brand-blush))"
        fillOpacity=".58"
      />
    </svg>
  );
}

export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HeartMark size={size} />
      <span
        className="font-display font-medium leading-none tracking-[-0.045em] text-text"
        style={{ fontSize: Math.round(size * 0.86) }}
      >
        {BRAND}
      </span>
    </span>
  );
}
