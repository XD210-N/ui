"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Viewport = { x: number; y: number; scale: number };

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const BASE_GRID = 28;
const ScaleContext = createContext(1);

type InfiniteCanvasProps = {
  children?: ReactNode;
  overlay?: ReactNode;
  className?: string;
};

export function InfiniteCanvas({ children, overlay, className }: InfiniteCanvasProps) {
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const centeredRef = useRef(false);

  useEffect(() => {
    if (centeredRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    centeredRef.current = true;
    setVp((prev) => ({ ...prev, x: rect.width / 2, y: rect.height / 2 }));
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, ox: vp.x, oy: vp.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setVp((prev) => ({
      ...prev,
      x: drag.ox + event.clientX - drag.startX,
      y: drag.oy + event.clientY - drag.startY,
    }));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setVp((prev) => {
        const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
        const ratio = next / prev.scale;
        return {
          scale: next,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const gridSize = BASE_GRID * vp.scale;

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div
        ref={gridRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: "var(--background)",
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${vp.x}px ${vp.y}px`,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})` }}
        >
          <ScaleContext.Provider value={vp.scale}>{children}</ScaleContext.Provider>
        </div>
      </div>
      {overlay}
    </div>
  );
}

export function CanvasItem({
  initialX = 0,
  initialY = 0,
  onSelect,
  children,
}: {
  initialX?: number;
  initialY?: number;
  onSelect?: () => void;
  children: ReactNode;
}) {
  const scale = useContext(ScaleContext);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    dragRef.current = { sx: event.clientX, sy: event.clientY, ox: pos.x, oy: pos.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.stopPropagation();
    const dx = event.clientX - drag.sx;
    const dy = event.clientY - drag.sy;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    setPos({ x: drag.ox + dx / scale, y: drag.oy + dy / scale });
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const wasClick = dragRef.current && !dragRef.current.moved;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    if (wasClick) onSelect?.();
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className="absolute cursor-grab select-none active:cursor-grabbing"
      style={{ left: pos.x, top: pos.y }}
    >
      {children}
    </div>
  );
}
