"use client";
import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Heading, Quote, List, ListOrdered } from "lucide-react";
import { cn } from "@/nucleo/utilitarios";

type Cmd = { icon: any; label: string; run: () => void; state?: string };

export function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const editor = ref.current;
    if (!editor || value === undefined || document.activeElement === editor) return;
    // Continua não-controlado enquanto a pessoa escreve, mas aceita uma
    // restauração externa de rascunho depois da hidratação sem mover o cursor.
    if (editor.innerHTML !== value) editor.innerHTML = value || "";
  }, [value]);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    refreshState();
  }

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function refreshState() {
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }

  const cmds: (Cmd & { key?: string })[] = [
    { icon: Bold, label: "Negrito", run: () => exec("bold"), key: "bold" },
    { icon: Italic, label: "Itálico", run: () => exec("italic"), key: "italic" },
    { icon: Underline, label: "Sublinhado", run: () => exec("underline"), key: "underline" },
    { icon: Strikethrough, label: "Tachado", run: () => exec("strikeThrough"), key: "strikeThrough" },
    { icon: Heading, label: "Título", run: () => exec("formatBlock", "H3") },
    { icon: Quote, label: "Citação", run: () => exec("formatBlock", "BLOCKQUOTE") },
    { icon: List, label: "Lista", run: () => exec("insertUnorderedList"), key: "insertUnorderedList" },
    { icon: ListOrdered, label: "Lista numerada", run: () => exec("insertOrderedList"), key: "insertOrderedList" },
  ];

  return (
    <div>
      <div role="toolbar" aria-label="Formatação do texto" className="mb-2 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg2 p-1">
        {cmds.map((c, i) => (
          <button
            key={i}
            type="button"
            title={c.label}
            aria-label={c.label}
            aria-pressed={c.key ? !!active[c.key] : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={c.run}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface2 hover:text-text",
              c.key && active[c.key] && "bg-accent/15 text-accent"
            )}
          >
            <c.icon size={16} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Texto da memória"
        data-placeholder={placeholder}
        onInput={emit}
        onKeyUp={refreshState}
        onMouseUp={refreshState}
        className="rich rich-editor focus-ring min-h-[160px] w-full rounded-xl border border-border bg-bg2 px-3.5 py-3 text-[15px] leading-relaxed text-text"
      />
    </div>
  );
}
