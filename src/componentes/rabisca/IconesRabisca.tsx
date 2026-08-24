export type RabiscaIconName =
  | "back" | "brush" | "timer" | "ink" | "home" | "map" | "plate" | "leaf"
  | "copy" | "play" | "rotate" | "expand" | "undo" | "clear" | "send"
  | "people" | "crown" | "offline" | "settings" | "exit" | "check" | "wait";

/** Conjunto próprio: ponta arredondada e aparência de nanquim do Enlace. */
export function RabiscaIcon({ name, size = 22 }: { name: RabiscaIconName; size?: number }) {
  const paths: Record<RabiscaIconName, React.ReactNode> = {
    back: <><path d="M15.5 5 8.5 12l7 7" /><path d="M9 12h10" /></>,
    brush: <><path d="m14 4 6 6-8.5 8.5-6.5 1 1-6.5L14 4Z" /><path d="m12.5 5.5 6 6" /><path d="m6 14 4 4" /></>,
    timer: <><circle cx="12" cy="13" r="7" /><path d="M9 3h6M12 6v2M17.5 7.5l1.5-1.5M12 13l3-2" /></>,
    ink: <><path d="M8 3h8v4l2.5 3v9H5.5v-9L8 7V3Z" /><path d="M8 7h8M8 14c2-2 6-2 8 0" /></>,
    home: <><path d="m4 11 8-7 8 7" /><path d="M6.5 10v10h11V10M10 20v-6h4v6" /></>,
    map: <><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" /><path d="M9 4v14M15 6v14" /></>,
    plate: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M3 5v6M5 5v6M4 11v8M20 5c-2 3-2 6 0 8v6" /></>,
    leaf: <><path d="M19 4C9 4 5 9 5 16c6 1 12-2 14-12Z" /><path d="M5 20c2-6 6-9 11-12" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="1" /><path d="M16 8V5H5v11h3" /></>,
    play: <path d="m9 6 9 6-9 6V6Z" />,
    rotate: <><rect x="6" y="5" width="12" height="14" rx="2" /><path d="M9 2h6M15 22H9" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></>,
    undo: <><path d="m9 7-5 5 5 5" /><path d="M5 12h8c4 0 6 2 6 6" /></>,
    clear: <><path d="m8 4 12 12-4 4H9L4 15 15 4" /><path d="m6 13 7 7" /></>,
    send: <><path d="m4 4 16 8-16 8 3-8-3-8Z" /><path d="M7 12h13" /></>,
    people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.5-5 10.5-5 11 0M14 15c3-2 6 0 6.5 4" /></>,
    crown: <><path d="m4 8 4 4 4-7 4 7 4-4-2 11H6L4 8Z" /><path d="M7 19h10" /></>,
    offline: <><path d="M5 9a11 11 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 17a2 2 0 0 1 2 0" /><path d="M3 3l18 18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
    exit: <><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    wait: <><path d="M7 3h10M7 21h10M8 3c0 5 2 6 4 9-2 3-4 4-4 9M16 3c0 5-2 6-4 9 2 3 4 4 4 9" /></>,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
