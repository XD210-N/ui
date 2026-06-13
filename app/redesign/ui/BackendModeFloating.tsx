"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Database, GripVertical, Server } from "lucide-react";
import { defaultBackendMode, getBackendMode, setBackendMode, type BackendMode } from "../bindings/backendMode";
import { probeEndpoints } from "../bindings/backendDiagnostics";
import { BackendDiagnosticsModal } from "./BackendDiagnosticsModal";

const FLOATING_POSITION_KEY = "omnistack-backend-floating-position";
const DEFAULT_POSITION = { x: 16, y: 16 };

export function BackendModeFloating() {
  const [mode, setMode] = useState<BackendMode>(defaultBackendMode);
  const [diagOpen, setDiagOpen] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const positionRef = useRef(DEFAULT_POSITION);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FLOATING_POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { x?: number; y?: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const next = { x: parsed.x, y: parsed.y };
          positionRef.current = next;
          setPosition(next);
        }
      }
    } catch {
      /* ignore */
    }

    const nextMode = getBackendMode();
    setMode(nextMode);
    if (nextMode !== "real") return;

    let cancelled = false;
    void probeEndpoints().then((results) => {
      if (!cancelled && results.some((result) => result.status === "fail")) {
        setDiagOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isReal = mode === "real";

  const onDragPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = { sx: event.clientX, sy: event.clientY, ox: position.x, oy: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - 120, drag.ox + event.clientX - drag.sx)),
      y: Math.max(8, Math.min(window.innerHeight - 40, drag.oy + event.clientY - drag.sy)),
    };
    positionRef.current = next;
    setPosition(next);
  };

  const onDragPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    try {
      window.localStorage.setItem(FLOATING_POSITION_KEY, JSON.stringify(positionRef.current));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="fixed z-[110] flex items-center gap-1.5" style={{ left: position.x, top: position.y }}>
        <button
          type="button"
          aria-label="拖动后端模式按钮"
          title="拖动位置"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerEnd}
          onPointerCancel={onDragPointerEnd}
          className="flex size-7 cursor-grab touch-none items-center justify-center rounded-full border border-[#ffd7c4] bg-[#fff1ea]/95 text-[#ff5a13] shadow-lg backdrop-blur-md active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setBackendMode(isReal ? "mock" : "real")}
          title={isReal ? "当前：真实后端。点击切到模拟数据" : "当前：模拟数据。点击切到真实后端"}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-colors ${
            isReal
              ? "border-white/15 bg-[#17191c]/90 text-[#f4f5f6] hover:bg-[#22262b]"
              : "border-[#ffd7c4] bg-[#fff1ea]/95 text-[#ff5a13] hover:bg-[#ffe6da]"
          }`}
        >
          {isReal ? <Server className="size-4" /> : <Database className="size-4" />}
          {isReal ? "真实后端" : "模拟数据"}
        </button>

        {isReal && (
          <button
            type="button"
            onClick={() => setDiagOpen(true)}
            title="查看后端连接诊断"
            className="rounded-full border border-white/15 bg-[#17191c]/90 px-3 py-1.5 text-xs font-medium text-[#9aa0a8] shadow-lg backdrop-blur-md transition-colors hover:text-[#f4f5f6]"
          >
            诊断
          </button>
        )}
      </div>

      <BackendDiagnosticsModal
        open={diagOpen}
        onClose={() => setDiagOpen(false)}
        onSwitchToMock={() => setBackendMode("mock")}
      />
    </>
  );
}
