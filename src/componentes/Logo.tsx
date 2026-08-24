import { cn } from "@/nucleo/utilitarios";
import { BRAND } from "@/nucleo/marca";

/**
 * A marca do Enlace: dois anéis que se cruzam.
 *
 * O desenho é
 * tipográfico: duas circunferências de raio 8.5 num viewBox de 34, traço de
 * 1.7. A da esquerda é tinta (`currentColor`, então herda o contexto e vira
 * papel quando cai sobre bloco escuro); a da direita é o carmim, com um
 * preenchimento de 16% que faz a interseção parecer duas folhas sobrepostas.
 *
 * Tudo escala a partir de `size` — o viewBox quadrado garante que a marca
 * ocupe exatamente `size`×`size`, de 12px (rodapé do livro) a 56px (capa).
 */
export function HeartMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      className={cn("text-text", className)}
      aria-hidden
    >
      <circle cx="12" cy="17" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <circle
        cx="22"
        cy="17"
        r="8.5"
        fill="rgb(var(--accent))"
        fillOpacity="0.16"
        stroke="rgb(var(--accent))"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HeartMark size={size} />
      {/* O logotipo acompanha a marca em vez de ficar preso a `text-2xl`:
          assim `<Logo size={24} />` continua sendo um conjunto proporcional. */}
      <span
        className="font-display leading-none tracking-[-0.03em] text-text"
        style={{ fontSize: Math.round(size * 0.78) }}
      >
        {BRAND}
      </span>
    </span>
  );
}
