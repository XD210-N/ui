"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronDown, FileText } from "lucide-react";
import { getCanvasState, subscribeCanvas } from "@/app/canvasStore";

type DocumentTab = "prd" | "plan";

type ProjectDocumentPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectMode: boolean;
};

function useCanvasSnapshot() {
  return useSyncExternalStore(subscribeCanvas, getCanvasState, getCanvasState);
}

function valueToText(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item !== "string" || !item.startsWith("upload/"))
      .join(", ");
  }
  if (typeof value === "string") {
    if (value.startsWith("['") && value.includes("upload/")) return "";
    return value;
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeRequirements(raw: string) {
  if (!raw) return "";
  const jsonStart = raw.indexOf("{");
  if (jsonStart === -1) return raw;

  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as {
      summary?: string;
      product?: Record<string, unknown>;
      ui?: Record<string, unknown>;
      driver?: Record<string, unknown>;
      bsp?: Record<string, unknown>;
      compile?: Record<string, unknown>;
      missing?: Array<{ section?: string; field?: string; question?: string }>;
    };

    const lines: string[] = [];
    if (parsed.summary) {
      lines.push(`需求概述\n${parsed.summary}`);
    }

    const sections: Array<[string, Record<string, unknown> | undefined]> = [
      ["Product", parsed.product],
      ["UI", parsed.ui],
      ["Driver", parsed.driver],
      ["BSP", parsed.bsp],
      ["Compile", parsed.compile],
    ];

    for (const [label, value] of sections) {
      if (!value || Object.keys(value).length === 0) continue;
      lines.push(label);
      for (const [key, item] of Object.entries(value)) {
        const display = valueToText(item);
        if (display) lines.push(`- ${key.replace(/_/g, " ")}: ${display}`);
      }
    }

    if (parsed.missing?.length) {
      lines.push("待确认");
      for (const item of parsed.missing) {
        const path = [item.section, item.field].filter(Boolean).join(" / ");
        lines.push(`- ${path}: ${item.question ?? ""}`);
      }
    }

    return lines.join("\n\n") || raw;
  } catch {
    return raw;
  }
}

export function ProjectDocumentPanel({
  open,
  onOpenChange,
  projectMode,
}: ProjectDocumentPanelProps) {
  const canvas = useCanvasSnapshot();
  const [activeTab, setActiveTab] = useState<DocumentTab>("prd");
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [segments, setSegments] = useState<Record<DocumentTab, string[]>>({
    prd: [],
    plan: [],
  });
  const [visible, setVisible] = useState<Record<DocumentTab, string>>({
    prd: "",
    plan: "",
  });
  const sourceRef = useRef<Record<DocumentTab, string>>({ prd: "", plan: "" });
  const clearedRef = useRef<Record<DocumentTab, boolean>>({ prd: false, plan: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const prdText = useMemo(() => {
    const parts = [
      normalizeRequirements(canvas.requirements),
      canvas.report ? `分析报告\n${canvas.report}` : "",
    ].filter(Boolean);
    return parts.join("\n\n");
  }, [canvas.requirements, canvas.report]);

  const planText = canvas.appPlan || "";
  const hasText = !!(prdText || planText);
  const shouldShow = projectMode && (open || hasText || hasOpenedOnce);

  const ingest = useCallback((tab: DocumentTab, nextText: string) => {
    if (!nextText) {
      if (sourceRef.current[tab]) {
        sourceRef.current = { ...sourceRef.current, [tab]: "" };
        clearedRef.current = { ...clearedRef.current, [tab]: true };
      }
      return;
    }

    const previous = sourceRef.current[tab];
    if (nextText === previous) return;

    const afterClear = clearedRef.current[tab];
    sourceRef.current = { ...sourceRef.current, [tab]: nextText };
    clearedRef.current = { ...clearedRef.current, [tab]: false };
    setSegments((current) => {
      const next = [...current[tab]];
      const last = next[next.length - 1];

      if (last === undefined) {
        next.push(nextText);
      } else if (!afterClear && previous && nextText.startsWith(previous) && last === previous) {
        next[next.length - 1] = nextText;
      } else if (afterClear || last !== nextText) {
        next.push(nextText);
      }

      return { ...current, [tab]: next };
    });
  }, []);

  useEffect(() => {
    if (!projectMode) {
      sourceRef.current = { prd: "", plan: "" };
      clearedRef.current = { prd: false, plan: false };
      setSegments({ prd: [], plan: [] });
      setVisible({ prd: "", plan: "" });
      setHasOpenedOnce(false);
      return;
    }
  }, [projectMode]);

  useEffect(() => {
    ingest("prd", prdText);
  }, [ingest, prdText]);

  useEffect(() => {
    ingest("plan", planText);
  }, [ingest, planText]);

  useEffect(() => {
    if (projectMode && hasText) {
      setHasOpenedOnce(true);
      onOpenChange(true);
      if (!prdText && planText) setActiveTab("plan");
    }
  }, [hasText, onOpenChange, planText, prdText, projectMode]);

  useEffect(() => {
    if (!shouldShow || !open) return;

    const id = window.setInterval(() => {
      setVisible((current) => {
        let changed = false;
        const next = { ...current };

        (["prd", "plan"] as const).forEach((tab) => {
          const target = segments[tab].join("\n\n");
          const shown = current[tab];
          if (shown.length >= target.length) return;

          const remaining = target.length - shown.length;
          const step = remaining > 600 ? 18 : remaining > 180 ? 10 : 4;
          next[tab] = target.slice(0, Math.min(target.length, shown.length + step));
          changed = true;
        });

        return changed ? next : current;
      });
    }, 24);

    return () => window.clearInterval(id);
  }, [open, segments, shouldShow]);

  const activeText = segments[activeTab].join("\n\n");
  const streamedText = visible[activeTab];
  const complete = streamedText.length >= activeText.length && activeText.length > 0;

  useEffect(() => {
    if (!open || !shouldShow) return;
    const el = scrollRef.current;
    if (!el) return;
    window.requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [activeTab, open, shouldShow, streamedText]);

  return (
    <section
      aria-label="需求文档"
      className={`fixed z-[52] transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
        shouldShow ? "opacity-100" : "pointer-events-none opacity-0"
      } ${
        open
          ? "bottom-4 right-4 top-4 w-[20vw] min-w-[300px] overflow-hidden rounded-[20px]"
          : "pointer-events-none bottom-4 right-4 top-4 w-[20vw] min-w-[300px] translate-x-[110%] overflow-hidden rounded-[20px]"
      } border border-[var(--border)] bg-[var(--card)]/82 shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur-2xl`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)]">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--foreground)]">需求文档</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              {complete ? "已同步" : hasText ? "正在生成" : "等待后端内容"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-[var(--muted)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("prd")}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                activeTab === "prd"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              需求
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                activeTab === "plan"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              方案
            </button>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="收起需求文档"
            className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronDown className="size-4" />
          </button>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {streamedText ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-6 text-[var(--foreground)]">
              {streamedText}
              {!complete && (
                <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[var(--primary)]" />
              )}
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              暂无内容
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
