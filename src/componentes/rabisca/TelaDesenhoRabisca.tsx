"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/nucleo/utilitarios";
import type { RabiscaRoomDTO } from "@/nucleo/rabisca/tipos";
import { RabiscaIcon } from "./IconesRabisca";

const COLORS = ["#17140F", "#C0395C", "#B8862F", "#287F79", "#294A70", "#76566E", "#F6F1E8"];
const WIDTHS = [3, 7, 14];

export function RabiscaCanvas({
  room,
  onAction,
}: {
  room: RabiscaRoomDTO;
  onAction: (move: Record<string, unknown>, quiet?: boolean) => Promise<any>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const current = useRef<[number, number][]>([]);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fffdf9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";

    const trace = (points: [number, number][], strokeColor: string, strokeWidth: number) => {
      if (points.length < 2) return;
      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth * Math.max(1, canvas.width / 900);
      context.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
      for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index][0] * canvas.width, points[index][1] * canvas.height);
      }
      context.stroke();
    };

    room.strokes.forEach((stroke) => trace(stroke.points, stroke.color, stroke.width));
    trace(current.current, color, width);
  }, [room.strokes, color, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const resize = () => {
      const rect = box.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      redraw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(redraw, [redraw]);

  const canDraw = room.isDrawer && room.status === "active";
  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    ];
  };

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    current.current = [pointAt(event)];
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const point = pointAt(event);
    const last = current.current[current.current.length - 1];
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.004) return;
    current.current.push(point);
    redraw();
  }

  async function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const points = current.current;
    if (points.length > 1) {
      await onAction({ type: "stroke", points, color, width }, true).catch(() => {});
    }
    current.current = [];
    redraw();
  }

  return (
    <div className="flex min-h-[420px] flex-1 flex-col landscape:min-h-0 md:min-h-0">
      <div ref={boxRef} className="relative min-h-[330px] flex-1 overflow-hidden bg-[#fffdf9] landscape:min-h-0 md:min-h-0">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className={cn("block h-full w-full", canDraw ? "touch-none cursor-crosshair" : "cursor-default")}
          aria-label={canDraw ? "Área para desenhar" : "Desenho da rodada"}
        />
      </div>

      <div className="flex min-h-[58px] shrink-0 items-center gap-2 overflow-x-auto border-t border-border2 bg-bg2 px-2 py-1.5">
        {canDraw ? (
          <>
            <div className="flex gap-1 border-r border-border2 pr-2">
              {COLORS.map((item) => (
                <button
                  key={item}
                  onClick={() => setColor(item)}
                  className={cn("focus-ring h-10 w-10 shrink-0 border-2", color === item ? "scale-105 border-text" : "border-border2")}
                  style={{ background: item }}
                  aria-label={`Cor ${item}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              {WIDTHS.map((item) => (
                <button
                  key={item}
                  onClick={() => setWidth(item)}
                  className={cn("focus-ring flex h-10 w-10 shrink-0 items-center justify-center border", width === item ? "border-text bg-text text-bg" : "border-border2 bg-surface")}
                  aria-label={`Traço ${item}`}
                >
                  <span className="rounded-full bg-current" style={{ width: item + 3, height: item + 3 }} />
                </button>
              ))}
            </div>
            <span className="flex-1" />
            <button onClick={() => onAction({ type: "undo" })} disabled={room.mode === "sem_borracha" || !room.strokes.length} className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center border border-border2 bg-surface disabled:opacity-30" aria-label="Desfazer">
              <RabiscaIcon name="undo" />
            </button>
            <button onClick={() => onAction({ type: "clear" })} disabled={room.mode === "sem_borracha" || !room.strokes.length} className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center border border-border2 bg-surface disabled:opacity-30" aria-label="Limpar quadro">
              <RabiscaIcon name="clear" />
            </button>
          </>
        ) : (
          <p className="mx-auto text-center text-xs font-bold text-muted">Observe o desenho e envie seu palpite no painel ao lado.</p>
        )}
      </div>
    </div>
  );
}
