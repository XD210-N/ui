"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Database, RefreshCw, X, XCircle } from "lucide-react";
import {
  probeEndpoints,
  getProbeBaseUrl,
  type ProbeResult,
} from "../bindings/backendDiagnostics";

type Props = {
  open: boolean;
  onClose: () => void;
  onSwitchToMock?: () => void;
};

/**
 * 真实模式连不上后端时弹出的诊断面板。
 * 列出每个需连后端的接口的连通状态；失败项展开“前端怎么对接的 + 甲方该怎么改”。
 * 纯诊断 UI，不发业务请求、不碰数据流。
 *
 * 自带固定深色配色（不依赖 .redesign-shell 的 CSS 变量），因为本组件可能在
 * AppShell 之外、ProjectGate 挡住主界面时渲染（真实模式连不上的场景）。
 */
export function BackendDiagnosticsModal({ open, onClose, onSwitchToMock }: Props) {
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [probing, setProbing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const runProbe = useCallback(async () => {
    setProbing(true);
    try {
      setResults(await probeEndpoints());
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void runProbe();
      setExpanded(null);
    }
  }, [open, runProbe]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const failCount = results.filter((r) => r.status === "fail").length;

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6 backdrop-blur-[2px] transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="后端连接诊断"
        className={`relative max-h-[86vh] w-full max-w-[760px] overflow-hidden rounded-[24px] border border-white/10 bg-[#17191c] text-[#f4f5f6] shadow-[0_30px_100px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          open ? "translate-y-0 scale-100" : "-translate-y-6 scale-[0.98]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-[#1d2024] text-[#9aa0a8] transition-colors hover:text-[#f4f5f6]"
        >
          <X className="size-5" />
        </button>

        <div className="max-h-[86vh] overflow-y-auto px-8 pb-8 pt-7">
          <div className="mb-5 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-7 shrink-0 text-[#ff5a13]" />
            <div>
              <h2 className="text-2xl font-black">后端连接诊断</h2>
              <p className="mt-1 text-sm text-[#9aa0a8]">
                当前为「真实」模式，后端地址：
                <code className="mx-1 rounded bg-[#1d2024] px-1.5 py-0.5 text-[#f4f5f6]">
                  {getProbeBaseUrl()}
                </code>
              </p>
              <p className="mt-1 text-sm text-[#9aa0a8]">
                {probing
                  ? "正在探测各接口连通性…"
                  : failCount > 0
                    ? `${failCount} 个接口连不上。点开失败项查看前端对接方式与修改建议；本地无后端时可点下方「切到模拟模式」先看效果。`
                    : "所有接口均可连通。"}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runProbe()}
              disabled={probing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1d2024] px-4 py-1.5 text-sm font-medium text-[#f4f5f6] transition-colors hover:bg-[#22262b] disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${probing ? "animate-spin" : ""}`} />
              重新探测
            </button>
            {onSwitchToMock && (
              <button
                type="button"
                onClick={onSwitchToMock}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff5a13] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff6a2a]"
              >
                <Database className="size-4" />
                切到模拟模式（看效果）
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {results.map((r) => {
              const isOpen = expanded === r.spec.key;
              const isFail = r.status === "fail";
              return (
                <li
                  key={r.spec.key}
                  className="overflow-hidden rounded-xl border border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : r.spec.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1d2024]"
                  >
                    {isFail ? (
                      <XCircle className="size-5 shrink-0 text-red-500" />
                    ) : (
                      <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                    )}
                    <span className="font-semibold">{r.spec.label}</span>
                    <code className="text-xs text-[#9aa0a8]">
                      {r.spec.method} {r.spec.path}
                    </code>
                    <span
                      className={`ml-auto text-xs ${isFail ? "text-red-400" : "text-green-400"}`}
                    >
                      {r.detail}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t border-white/10 bg-black/20 px-4 py-3 text-sm">
                      <div>
                        <span className="font-semibold">调用位置：</span>
                        <code className="text-[#9aa0a8]">{r.spec.caller}</code>
                      </div>
                      <div>
                        <span className="font-semibold">前端当前怎么对接：</span>
                        <p className="mt-1 leading-relaxed text-[#9aa0a8]">
                          {r.spec.howWired}
                        </p>
                      </div>
                      {isFail && (
                        <div>
                          <span className="font-semibold text-[#ff5a13]">
                            贵方该怎么改：
                          </span>
                          <p className="mt-1 leading-relaxed text-[#9aa0a8]">
                            {r.spec.fixHint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-5 text-xs text-[#6b7077]">
            说明：能拿到任何 HTTP 响应即视为「连通」（后端在，可能只是该端点逻辑或数据问题）；
            fetch 直接失败视为「连不上」。完整对接与还原说明见 MD/甲方对接与模拟说明.md。
          </p>
        </div>
      </section>
    </div>
  );
}
