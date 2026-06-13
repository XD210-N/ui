"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FC } from "react";
import { useStrings } from "@/lib/strings-context";
import { getCanvasState, subscribeCanvas } from "./canvasStore";
import { setSelectedBoard, useSelectedBoard } from "./boardStore";

const SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:8000";

type CanvasState = ReturnType<typeof getCanvasState>;
function useCanvasState(): CanvasState {
  return useSyncExternalStore(subscribeCanvas, getCanvasState, getCanvasState);
}

type JobKind = "preview" | "build" | "deploy";

type SupportedBoard = {
  id: string;
  display_name: string;
  arch: string;
  description: string;
  resolution?: string;
};

type ConnectedBoard = {
  id?: string;
  display_name?: string;
};

type ConnectedProxy = {
  proxy_id: string;
  device_name?: string | null;
  project_name?: string | null;
  model?: string | null;
  screen_size?: { width: number; height: number } | null;
  boards: (string | ConnectedBoard)[];
};

type PairCodeResult = {
  pair_code?: string;
  expires_at?: string;
  pair_url?: string;
  daemon_command?: string | null;
  device_name?: string;
};

const boardLabel = (board: string | ConnectedBoard): string =>
  typeof board === "string" ? board : (board.display_name ?? board.id ?? "");

export const WelcomeTab: FC = () => {
  const s = useStrings();
  const [supportedBoards, setSupportedBoards] = useState<SupportedBoard[]>([]);
  const [connectedProxies, setConnectedProxies] = useState<ConnectedProxy[]>([]);
  const [refreshingBoards, setRefreshingBoards] = useState(false);
  const selectedBoard = useSelectedBoard();
  const [pairing, setPairing] = useState(false);
  const [pairResult, setPairResult] = useState<PairCodeResult | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);

  const refreshBoards = useCallback(async (force = false) => {
    setRefreshingBoards(true);
    try {
      const res = await fetch(`${SAAS_URL}/v1/boards${force ? "?refresh=1" : ""}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setSupportedBoards((data.supported ?? []) as SupportedBoard[]);
      setConnectedProxies((data.connected ?? []) as ConnectedProxy[]);
    } catch {
      /* ignore */
    } finally {
      setRefreshingBoards(false);
    }
  }, []);

  useEffect(() => {
    void refreshBoards();
    const id = window.setInterval(() => {
      void refreshBoards();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [refreshBoards]);

  const generatePairCode = useCallback(async () => {
    setPairing(true);
    setPairError(null);
    try {
      const res = await fetch(`${SAAS_URL}/v1/pair-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPairError(data?.detail ?? `HTTP ${res.status}`);
        return;
      }
      setPairResult(data as PairCodeResult);
    } catch (error) {
      setPairError(error instanceof Error ? error.message : String(error));
    } finally {
      setPairing(false);
    }
  }, []);

  return (
    <div className="space-y-4 p-4 text-sm text-[var(--foreground)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">硬件设置</div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">板卡列表、配对码与连接状态。</div>
        </div>
        <button
          type="button"
          onClick={() => void refreshBoards(true)}
          className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--accent)]"
        >
          {refreshingBoards ? "刷新中..." : "刷新"}
        </button>
      </div>

      <div className="space-y-2">
        {supportedBoards.length > 0 ? (
          supportedBoards.map((board) => {
            const active = board.id === selectedBoard;
            return (
              <button
                type="button"
                key={board.id}
                onClick={() => setSelectedBoard(board.id)}
                aria-pressed={active}
                className={`w-full rounded-2xl border p-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-colors ${
                  active
                    ? "border-[color-mix(in_srgb,var(--primary)_48%,var(--border))] bg-[var(--primary)]/10"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${active ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                      <span className="truncate font-medium">{board.display_name}</span>
                      {active && <span className="text-[10px] text-[var(--primary)]">已选</span>}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {board.arch}
                      {board.resolution ? ` · ${board.resolution}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]">
                    {board.id}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{board.description}</div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
            暂无可用板卡
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{s.connectedHardwareTitle}</div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]">
            {connectedProxies.length}
          </span>
        </div>
        {connectedProxies.length === 0 ? (
          <div className="text-xs text-[var(--muted-foreground)]">{s.noConnectedHardware}</div>
        ) : (
          <div className="space-y-2">
            {connectedProxies.map((proxy) => (
              <div key={proxy.proxy_id} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium">
                    {proxy.project_name ?? proxy.model ?? proxy.device_name ?? proxy.proxy_id}
                  </span>
                  {proxy.screen_size && (
                    <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                      {proxy.screen_size.width}x{proxy.screen_size.height}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {proxy.boards.map((board) => {
                    const label = boardLabel(board);
                    return (
                      <span
                        key={label}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-500"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <button
          type="button"
          onClick={() => void generatePairCode()}
          className="rounded-full border border-[var(--border)] bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-[0_8px_20px_rgba(255,90,19,0.2)] transition-colors hover:bg-[#ff6a2a]"
        >
          {pairing ? "生成中..." : "生成配对码"}
        </button>
        {pairError && <div className="mt-3 text-xs text-red-400">{pairError}</div>}
        {pairResult && (
          <div className="mt-3 space-y-2 text-xs text-[var(--muted-foreground)]">
            {pairResult.pair_code && <div>配对码：{pairResult.pair_code}</div>}
            {pairResult.expires_at && <div>过期时间：{pairResult.expires_at}</div>}
            {pairResult.pair_url && <div className="break-all">地址：{pairResult.pair_url}</div>}
            {pairResult.daemon_command && <div className="break-all">命令：{pairResult.daemon_command}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export function ArtifactCanvas() {
  const { requirements, appPlan, report, runId, runComplete, screenPngs } = useCanvasState();
  const s = useStrings();
  const [connectedCount, setConnectedCount] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [building, setBuilding] = useState(false);
  const [jobKind, setJobKind] = useState<JobKind | null>(null);
  const [jobMsg, setJobMsg] = useState("");
  const [jobLog, setJobLog] = useState("");
  const jobLogRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${SAAS_URL}/v1/boards`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setConnectedCount((data.connected ?? []).length);
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = window.setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const runJob = useCallback(
    async (kind: "deploy" | "preview-hardware" | "build", setBusy: (busy: boolean) => void, label: string) => {
      if (!runId || !runComplete) return;
      setBusy(true);
      setJobKind(kind === "preview-hardware" ? "preview" : kind);
      setJobMsg(`${label} 启动中...`);
      setJobLog("");

      const base = `${SAAS_URL}/v1/runs/${encodeURIComponent(runId)}/${kind}`;
      try {
        const started = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });

        if (!started.ok) {
          let detail = `HTTP ${started.status}`;
          try {
            const err = await started.json();
            if (err?.detail) detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
          } catch {
            /* ignore */
          }
          setJobMsg(`${label} 失败：${detail}`);
          return;
        }

        for (;;) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const res = await fetch(base);
          if (!res.ok) continue;
          const data = await res.json();
          if (typeof data.log === "string") setJobLog(data.log);
          if (data.state === "success") {
            setJobMsg(`${label} 完成`);
            return;
          }
          if (data.state === "error") {
            setJobMsg(`${label} 失败：${data.step ?? "unknown"} (rc=${data.returncode})`);
            return;
          }
          setJobMsg(`${label} 进行中${data.step ? ` · ${data.step}` : ""}`);
        }
      } catch (error) {
        setJobMsg(`${label} 失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setBusy(false);
      }
    },
    [runComplete, runId],
  );

  const handlePreview = useCallback(() => {
    if (!runId || !runComplete) return;
    window.dispatchEvent(new CustomEvent("redesign-preview-selected-screen"));
  }, [runComplete, runId]);

  const handleBuild = useCallback(() => {
    if (!runId || !runComplete || building) return;
    void runJob("build", setBuilding, s.btnBuild || "Build");
  }, [building, runComplete, runId, runJob, s.btnBuild]);

  const handleRunOnHardware = useCallback(() => {
    if (!runId || !runComplete || deploying || connectedCount === 0) return;
    void runJob("deploy", setDeploying, s.btnRunOnHardware);
  }, [connectedCount, deploying, runComplete, runId, runJob, s.btnRunOnHardware]);

  const hasAny = Boolean(requirements || appPlan || report || screenPngs.length > 0);

  useEffect(() => {
    const el = jobLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [jobLog]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--card)]/45">
      <div className="shrink-0 border-b border-[var(--border)] px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_rgba(255,90,19,0.45)]" />
          <span className="min-w-0 truncate text-xs font-semibold tracking-wide text-[var(--foreground)]">
            {s.previewCanvas}
          </span>
          {hasAny && <span className="ml-auto size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={!runId || !runComplete}
            onClick={handlePreview}
            title={!runId || !runComplete ? s.prdNotGenerated : undefined}
            className="h-9 rounded-full border border-indigo-500/35 bg-indigo-500/10 px-3 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {s.btnPreview || "Preview"}
          </button>
          <button
            type="button"
            disabled={!runId || !runComplete || building}
            onClick={handleBuild}
            title={!runId || !runComplete ? s.prdNotGenerated : undefined}
            className="h-9 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {building ? "Building..." : (s.btnBuild || "Build")}
          </button>
          <button
            type="button"
            disabled={!runId || !runComplete || connectedCount === 0 || deploying}
            onClick={handleRunOnHardware}
            title={!runId || !runComplete ? s.prdNotGenerated : connectedCount === 0 ? s.btnRunOnHardwareNoDevice : undefined}
            className="h-9 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deploying ? s.btnDeploying : s.btnRunOnHardware}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 py-4">
        <div
          className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border bg-[var(--muted)]/25 text-[11px] ${
            jobKind === "build"
              ? "border-amber-500/30"
              : jobKind === "deploy"
                ? "border-emerald-500/30"
                : "border-[var(--border)]"
          }`}
        >
          <div className="shrink-0 border-b border-[var(--border)] px-3 py-2 text-[var(--muted-foreground)]">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{jobMsg || (runComplete ? "Ready" : "Pending")}</span>
              <span className="font-mono">{screenPngs.length}</span>
            </div>
          </div>
          <pre
            ref={jobLogRef}
            className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-[10px] leading-5 text-[var(--foreground)]"
          >
            {jobLog || "Output will stream here."}
          </pre>
          <div className="shrink-0 px-5 pb-4 pt-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("redesign-open-hardware-settings"))}
              className="flex h-8 w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/86 px-3 text-xs font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(15,23,42,0.10)] backdrop-blur-md transition-colors hover:bg-[var(--card)]"
            >
              硬件设置
            </button>
          </div>
        </div>
      </div>

      {false && (
        <div>
        <section
          role="dialog"
          aria-modal="true"
          aria-label="任务输出"
          className={`relative w-[min(92vw,720px)] overflow-hidden rounded-[28px] border bg-[var(--card)]/96 p-6 shadow-[0_34px_110px_rgba(15,23,42,0.22)] backdrop-blur-2xl ${
            jobKind === "build"
              ? "border-amber-500/35"
              : jobKind === "deploy"
                ? "border-emerald-500/35"
                : "border-indigo-500/35"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`size-2.5 rounded-full ${
                jobKind === "build"
                  ? "bg-amber-400"
                  : jobKind === "deploy"
                    ? "bg-emerald-400"
                    : "bg-indigo-400"
              }`}
            />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {jobKind === "build" ? (s.btnBuild || "Build") : jobKind === "deploy" ? s.btnRunOnHardware : s.btnPreview}
            </h3>
            <button
              type="button"
              onClick={() => undefined}
              aria-label="关闭"
              className="ml-auto flex size-8 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="text-base leading-none">×</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{jobMsg || "正在执行任务..."}</p>
          <pre
            ref={jobLogRef}
            className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono text-[11px] leading-relaxed text-[var(--foreground)]"
          >
            {jobLog || "日志会在这里流式输出。"}
          </pre>
        </section>
        </div>
      )}
    </div>
  );
}
