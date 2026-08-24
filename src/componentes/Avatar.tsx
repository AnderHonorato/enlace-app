import { cn, initials } from "@/nucleo/utilitarios";

type Props = {
  name: string;
  color?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
};

export function Avatar({ name, color, url, size = 40, className, ring }: Props) {
  const style = { width: size, height: size };
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none",
        ring && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
        className
      )}
      style={{ ...style, background: url ? undefined : color || "#E5679B", fontSize: size * 0.4 }}
      aria-hidden
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
