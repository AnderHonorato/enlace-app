"use client";

function hashName(name: string) {
  let value = 17;
  for (const char of name) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

const ACCENTS = ["#F2C14E", "#62B6A0", "#7AA8D8", "#D0718D", "#A78AC5", "#E58A55"];

/** Criatura de tinta original e determinística: o mesmo nome mantém a mesma aparência. */
export function RabiscaAvatar({
  name,
  color,
  url,
  size = 40,
}: {
  name: string;
  color?: string | null;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <span className="inline-flex shrink-0 overflow-hidden rounded-full border-2 border-text bg-surface" style={{ width: size, height: size }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  const seed = hashName(name);
  const variant = seed % 6;
  const accent = ACCENTS[(seed >>> 4) % ACCENTS.length];
  const body = color || "#C0395C";
  const eyeShift = variant % 2 ? 1 : -1;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="shrink-0" aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#F7EEDC" stroke="#17140F" strokeWidth="3" />
      {variant === 0 ? <path d="m17 23 2-13 11 10m17 3-2-13-11 10" fill={accent} stroke="#17140F" strokeWidth="3" strokeLinejoin="round" /> : null}
      {variant === 1 ? <><path d="M32 17c-1-8 6-11 12-10-1 7-5 11-12 10Z" fill="#62B65E" stroke="#17140F" strokeWidth="3" /><path d="M32 17c-3-7-9-8-14-5 3 6 7 8 14 5Z" fill="#8BCB64" stroke="#17140F" strokeWidth="3" /></> : null}
      {variant === 2 ? <><path d="M32 16V8" stroke="#17140F" strokeWidth="3" strokeLinecap="round" /><circle cx="32" cy="7" r="3.5" fill={accent} stroke="#17140F" strokeWidth="2.5" /></> : null}
      {variant === 3 ? <path d="m17 20 3-11 10 8 7-10 8 10 6-8 1 15" fill={accent} stroke="#17140F" strokeWidth="3" strokeLinejoin="round" /> : null}
      {variant === 4 ? <><path d="M18 22C7 17 6 31 18 35" fill={accent} stroke="#17140F" strokeWidth="3" /><path d="M46 22c11-5 12 9 0 13" fill={accent} stroke="#17140F" strokeWidth="3" /></> : null}
      {variant === 5 ? <path d="M16 23c4-12 28-15 35 1-9-4-14 1-21-2-6-3-9 3-14 1Z" fill={accent} stroke="#17140F" strokeWidth="3" /> : null}
      <path d="M15 33c0-12 8-19 17-19s17 7 17 19c0 13-7 21-17 21s-17-8-17-21Z" fill={body} stroke="#17140F" strokeWidth="3" />
      {variant === 2 ? <path d="M19 26h26v17H19z" fill={accent} opacity=".55" /> : null}
      <ellipse cx={25 + eyeShift} cy="32" rx="4.5" ry="6" fill="#FFFDF8" stroke="#17140F" strokeWidth="2.5" />
      <ellipse cx={39 + eyeShift} cy="32" rx="4.5" ry="6" fill="#FFFDF8" stroke="#17140F" strokeWidth="2.5" />
      <circle cx={26 + eyeShift} cy="33" r="1.8" fill="#17140F" />
      <circle cx={40 + eyeShift} cy="33" r="1.8" fill="#17140F" />
      <path d={variant % 2 ? "M25 44c4 4 10 4 14 0" : "M25 43c3 7 11 7 14 0"} fill={variant % 2 ? "none" : "#FFFDF8"} stroke="#17140F" strokeWidth="2.5" strokeLinecap="round" />
      {variant === 4 ? <circle cx="17" cy="39" r="2.2" fill={accent} /> : null}
    </svg>
  );
}
