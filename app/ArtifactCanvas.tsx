"use client";

import { useState, useSyncExternalStore, useEffect, useRef, useCallback, type FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCanvasState, subscribeCanvas } from "./canvasStore";
import { useSelectedBoard, setSelectedBoard } from "./boardStore";
import { useStrings } from "@/lib/strings-context";

const SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "";

function useCanvasState() {
  return useSyncExternalStore(subscribeCanvas, getCanvasState, getCanvasState);
}

// ── PRD table helpers ────────────────────────────────────────────────────────

interface PrdRequirements {
  status?: string;
  summary?: string;
  product?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  driver?: Record<string, unknown>;
  bsp?: Record<string, unknown>;
  compile?: Record<string, unknown>;
  missing?: Array<{ section?: string; field?: string; question?: string }>;
}

/** Convert a requirements value to a display string, filtering bare upload keys. */
function valueToString(v: unknown): string {
  if (Array.isArray(v)) {
    const filtered = v.filter(
      (item) => typeof item !== "string" || !item.startsWith("upload/"),
    );
    return filtered.length > 0 ? filtered.join(", ") : "";
  }
  if (typeof v === "string") {
    // hide bare upload-key strings like "['upload/00_foo.jpg']"
    if (v.startsWith("['") && v.includes("upload/")) return "";
    return v;
  }
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Build a markdown document from requirements JSON. */
function requirementsToMarkdown(raw: string): string {
  const reqs = parsePrdRequirements(raw);
  if (!reqs) return raw;

  const lines: string[] = [];

  if (reqs.summary) {
    lines.push(`## Summary\n\n${reqs.summary}\n`);
  }

  for (const section of PRD_SECTIONS) {
    const data = reqs[section] as Record<string, unknown> | undefined;
    if (!data || Object.keys(data).length === 0) continue;

    const label = SECTION_LABELS[section] ?? section;
    lines.push(`## ${label}\n`);

    for (const [key, value] of Object.entries(data)) {
      const display = valueToString(value);
      if (!display) continue;
      lines.push(`**${key.replace(/_/g, " ")}:** ${display}\n`);
    }
    lines.push("");
  }

  if (reqs.missing && reqs.missing.length > 0) {
    lines.push("## Clarification Needed\n");
    for (const item of reqs.missing) {
      const prefix = [item.section, item.field ? item.field.replace(/_/g, " ") : ""]
        .filter(Boolean)
        .join(" › ");
      lines.push(`- **${prefix}:** ${item.question ?? ""}\n`);
    }
    lines.push("");
  }

  return lines.join("\n") || raw;
}

function parsePrdRequirements(raw: string): PrdRequirements | null {
  const jsonStart = raw.indexOf("{");
  if (jsonStart === -1) return null;
  try {
    return JSON.parse(raw.slice(jsonStart)) as PrdRequirements;
  } catch {
    return null;
  }
}

const SECTION_LABELS: Record<string, string> = {
  product: "Product",
  ui: "UI",
  driver: "Driver",
  bsp: "BSP",
  compile: "Compile",
};

const PRD_SECTIONS = ["product", "ui", "driver", "bsp", "compile"] as const;

// ── Markdown PRD renderer ────────────────────────────────────────────────────

const PrdMarkdown: FC<{ raw: string }> = ({ raw }) => {
  const md = requirementsToMarkdown(raw);

  return (
    <div className="min-w-0 max-w-full break-words">
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400/80 first:mt-0 border-b border-white/8 pb-1">
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p className="mb-2 min-w-0 break-words text-sm text-foreground/85 leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-medium text-foreground/60 text-xs">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1 pl-0 list-none">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="min-w-0 break-words border-l border-amber-500/30 pl-3 text-sm text-foreground/80">
              {children}
            </li>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
};

type Tab = "welcome" | "prd" | "slint" | "screens";

// ── Screen PNG grid ─────────────────────────────────────────────────────────────

const ScreenGrid: FC<{ pngs: string[]; lapSystemDir: string }> = ({ pngs, lapSystemDir }) => {
  const saasUrl = process.env.NEXT_PUBLIC_SAAS_URL ?? "";
  const [expanded, setExpanded] = useState<number | null>(null);

  if (pngs.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground/60 py-8">
        No screen previews generated yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {pngs.map((png, i) => {
        // Construct the URL to the PNG via the saas file serving endpoint
        const runId = lapSystemDir.split('/').pop()?.replace('app_', '');
        const pngUrl = `${saasUrl}/v1/runs/${runId}/files/screens/${png}`;
        return (
          <div key={i} className="relative rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full aspect-video flex items-center justify-center bg-black/30"
            >
              <img
                src={pngUrl}
                alt={png}
                className={`object-contain transition-all ${
                  expanded === i ? "max-w-full max-h-[500px]" : "max-w-full max-h-40"
                }`}
              />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <span className="text-xs text-white/80 font-mono">{png}</span>
            </div>
            {expanded === i && (
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => setExpanded(null)}
                  className="rounded bg-black/50 px-2 py-1 text-xs text-white/70 hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Welcome tab ──────────────────────────────────────────────────────────────

interface SupportedBoard {
  id: string;
  display_name: string;
  arch: string;
  description: string;
  resolution?: string;
}

interface ConnectedBoard {
  id?: string;
  display_name?: string;
}

interface ConnectedProxy {
  proxy_id: string;
  device_name?: string | null;
  project_name?: string | null;
  model?: string | null;
  soc?: string | null;
  screen_size?: { width: number; height: number } | null;
  project_id?: string | null;
  boards: (string | ConnectedBoard)[];
}

const boardLabel = (b: string | ConnectedBoard): string =>
  typeof b === "string" ? b : (b.display_name ?? b.id ?? "");

interface PairCodeResult {
  pair_code?: string;
  expires_at?: string;
  pair_url?: string;
  daemon_command?: string | null;
  device_name?: string;
}

const WelcomeTab: FC = () => {
  const s = useStrings();
  const [supportedBoards, setSupportedBoards] = useState<SupportedBoard[]>([]);
  const [connectedProxies, setConnectedProxies] = useState<ConnectedProxy[]>([]);
  const [refreshingBoards, setRefreshingBoards] = useState(false);
  const selectedBoard = useSelectedBoard();
  const [pairing, setPairing] = useState(false);
  const [pairResult, setPairResult] = useState<PairCodeResult | null>(null);
  const [pairError, setPairError] = useState<string | null>(null);

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
      setPairResult(data);
    } catch (e) {
      setPairError(String(e));
    } finally {
      setPairing(false);
    }
  }, []);

  const fetchBoards = useCallback(async (force = false) => {
    // force=true → ?refresh=1 bypasses the backend's 4s cache and re-probes
    // lap_mcp immediately (used by the manual refresh button after a board swap).
    const res = await fetch(`${SAAS_URL}/v1/boards${force ? "?refresh=1" : ""}`);
    if (!res.ok) return;
    const data = await res.json();
    setSupportedBoards(data.supported ?? []);
    setConnectedProxies(data.connected ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = () => { if (!cancelled) void fetchBoards().catch(() => {}); };
    tick();
    const interval = setInterval(tick, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchBoards]);

  const handleRefreshBoards = useCallback(async () => {
    setRefreshingBoards(true);
    try {
      await fetchBoards(true);
    } catch { /* ignore */ } finally {
      setRefreshingBoards(false);
    }
  }, [fetchBoards]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-4">
        <img src="/os.jpg" alt="OmniStack" className="size-8 rounded-lg object-cover flex-shrink-0 opacity-75" />
        <p className="text-sm text-foreground/75 leading-relaxed">{s.welcomeGreeting}</p>
      </div>

      {/* Supported Hardware */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400/80 border-b border-white/8 pb-1">
          {s.supportedHardwareTitle}
        </h3>
        <ul className="space-y-2">
          {supportedBoards.map((b) => {
            const active = b.id === selectedBoard;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelectedBoard(b.id)}
                  aria-pressed={active}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/8 bg-white/3 hover:bg-white/5"
                  }`}
                >
                  <span className={`mt-1 size-2 flex-shrink-0 rounded-full ${active ? "bg-purple-400" : "bg-white/20"}`} />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground/85">{b.display_name}</span>
                    {b.resolution && (
                      <span className="ml-2 font-mono text-xs text-emerald-300">{b.resolution}</span>
                    )}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{b.arch}</span>
                    {active && <span className="ml-2 text-xs text-purple-300">✓ 已选</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Connected Hardware */}
      <section>
        <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-400/80">
            {s.connectedHardwareTitle}
          </h3>
          <button
            type="button"
            onClick={handleRefreshBoards}
            disabled={refreshingBoards}
            title="刷新（重新探测已连接硬件）"
            aria-label="刷新已连接硬件"
            className="rounded p-1 text-muted-foreground/70 hover:text-foreground hover:bg-white/5 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={refreshingBoards ? "animate-spin" : undefined}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
        {connectedProxies.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 italic">{s.noConnectedHardware}</p>
        ) : (
          <ul className="space-y-2">
            {connectedProxies.map((p) => (
              <li key={p.proxy_id} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="size-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground/85">
                    {p.project_name ?? p.model ?? p.device_name ?? p.proxy_id}
                  </span>
                  {p.screen_size && (
                    <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
                      {p.screen_size.width}×{p.screen_size.height}
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.proxy_id.length > 14 ? `${p.proxy_id.slice(0, 14)}…` : p.proxy_id}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.boards.map((b) => {
                    const label = boardLabel(b);
                    return (
                      <span key={label} className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-300">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pair a board (generate pair code) */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400/80 border-b border-white/8 pb-1">
          配对设备
        </h3>
        <button
          type="button"
          onClick={generatePairCode}
          disabled={pairing}
          className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-sm font-medium text-purple-200 hover:bg-purple-500/25 disabled:opacity-50"
        >
          {pairing ? "生成中…" : "生成配对码"}
        </button>
        {pairError && (
          <p className="mt-2 text-xs text-red-400">配对码生成失败：{pairError}</p>
        )}
        {pairResult?.pair_code && (
          <div className="mt-3 space-y-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-lg font-semibold tracking-widest text-emerald-300">
                {pairResult.pair_code}
              </span>
              {pairResult.expires_at && (
                <span className="text-xs text-muted-foreground/60">有效期至 {pairResult.expires_at}</span>
              )}
            </div>
            {pairResult.daemon_command && (
              <div>
                <p className="text-xs text-muted-foreground/60 mb-1">在板子的 lap 守护进程上运行：</p>
                <code className="block select-all rounded bg-black/40 px-2 py-1.5 font-mono text-xs text-foreground/85 break-all">
                  {pairResult.daemon_command}
                </code>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Usage */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400/80 border-b border-white/8 pb-1">
          {s.usageTitle}
        </h3>
        <ol className="space-y-2">
          {s.usageSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground/65 leading-relaxed">
              <span className="flex-shrink-0 flex size-5 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[10px] font-semibold text-purple-300/80">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

// ── Mermaid diagram block ────────────────────────────────────────────────────

let _mermaidReady = false;

const MermaidBlock: FC<{ code: string }> = ({ code }) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!_mermaidReady) {
          mermaid.initialize({ theme: "dark", startOnLoad: false, securityLevel: "loose" });
          _mermaidReady = true;
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, code);
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="my-4 max-w-full overflow-x-auto rounded-xl border border-red-500/30 bg-black/30 p-4 text-xs text-red-400/80">
        {code}
      </pre>
    );
  }
  if (!svg) {
    return (
      <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/30 italic">
        Rendering diagram…
      </div>
    );
  }
  return (
    <div
      className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// ── Report markdown renderer (GFM tables + Mermaid) ───────────────────────────

const ReportMarkdown: FC<{ raw: string; runId: string }> = ({ raw, runId }) => (
  <div className="report-md min-w-0 max-w-full break-words">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="mt-6 mb-2 break-words border-b border-white/8 pb-1 text-xs font-semibold uppercase tracking-widest text-purple-400/80 first:mt-0">
            {children}
          </h2>
        ),
        p: ({ children }) => (
          <p className="mb-2 min-w-0 break-words text-sm text-foreground/85 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-foreground/60 text-xs">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/10">
            <table style={{ minWidth: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ background: "rgba(255,255,255,0.05)", color: "rgb(192,168,255)" }}>
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", verticalAlign: "top", color: "rgba(255,255,255,0.75)" }}>
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr style={{ transition: "background 0.15s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
            {children}
          </tr>
        ),
        // Resolve upload/ artifact keys to server image URLs
        img: ({ src, alt }) => {
          const rawSrc = typeof src === "string" ? src : "";
          let resolvedSrc = rawSrc;
          if (resolvedSrc && !resolvedSrc.startsWith("http") && !resolvedSrc.startsWith("data:")) {
            resolvedSrc = `${SAAS_URL}/v1/runs/${runId}/files/${resolvedSrc}`;
          }
          return (
            <img
              src={resolvedSrc}
              alt={alt ?? ""}
              style={{ maxWidth: "min(100%, 120px)", maxHeight: "80px", borderRadius: "4px", objectFit: "cover" }}
            />
          );
        },
        // Render ```mermaid blocks with the Mermaid library
        code({ className, children }) {
          const lang = (className ?? "").replace("language-", "");
          const codeText = String(children).trim();
          if (lang === "mermaid") {
            return <MermaidBlock code={codeText} />;
          }
          return (
            <code className="break-all rounded bg-white/8 px-1 py-0.5 font-mono text-xs text-emerald-300/90">
              {codeText}
            </code>
          );
        },
        pre({ children }) {
          // Let the code renderer handle fenced blocks; avoid double-wrapping
          return <>{children}</>;
        },
      }}
    >
      {raw}
    </ReactMarkdown>
  </div>
);

// ── Uploaded image thumbnails ────────────────────────────────────────────────

const UploadedImages: FC<{ images: string[] }> = ({ images }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="mb-5 pb-4 border-b border-white/8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400/80">
        Reference Screenshots
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-all hover:border-purple-500/40 focus:outline-none"
          >
            <img
              src={src}
              alt={`Upload ${i + 1}`}
              className={`object-cover transition-all ${
                expanded === i
                  ? "max-h-72 w-auto max-w-full"
                  : "h-20 w-28 group-hover:opacity-90"
              }`}
            />
            {expanded !== i && (
              <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-1">
                <span className="text-[10px] text-white/60">#{i + 1}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main canvas component ────────────────────────────────────────────────────

export function ArtifactCanvas() {
  const { requirements, appPlan, uploadImages, report, runId, runComplete, screenPngs, lapSystemDir } = useCanvasState();
  const [activeTab, setActiveTab] = useState<Tab>("welcome");
  const s = useStrings();
  const [connectedCount, setConnectedCount] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [building, setBuilding] = useState(false);
  const [jobMsg, setJobMsg] = useState<string>("");
  const [jobLog, setJobLog] = useState<string>("");
  const [jobLogOpen, setJobLogOpen] = useState<boolean>(true);
  const jobLogRef = useRef<HTMLPreElement>(null);

  // Poll /v1/boards every 10 s to know if hardware is available for the button
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${SAAS_URL}/v1/boards`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setConnectedCount((data.connected ?? []).length);
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Bridge the buttons to the real lap pipeline. The backend runs the SAME
  // scripts/lap/*.py the VS Code tasks wrap, as a background job we poll:
  //   preview-hardware = assemble-system-folder + preview-slint
  //   deploy           = init-workspace + package + flash
  const runJob = useCallback(
    async (kind: "deploy" | "preview-hardware" | "build", setBusy: (b: boolean) => void, label: string) => {
      if (!runId || !runComplete) return;
      setBusy(true);
      setJobMsg(`${label}…`);
      setJobLog("");
      setJobLogOpen(true);
      const base = `${SAAS_URL}/v1/runs/${encodeURIComponent(runId)}/${kind}`;
      try {
        const started = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!started.ok) {
          // Surface the backend's reason (e.g. a 404 means this run produced no
          // build folder — UI build failed or not generated yet) instead of a
          // bare status code, so the user knows it isn't the endpoint failing.
          let detail = `HTTP ${started.status}`;
          try {
            const err = await started.json();
            if (err?.detail) {
              detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
            }
          } catch {
            /* non-JSON body — keep the status code */
          }
          setJobMsg(`${label} ✗ — ${detail}`);
          return;
        }
        // Poll until the chain finishes.
        for (;;) {
          await new Promise((r) => setTimeout(r, 2000));
          const res = await fetch(base);
          if (!res.ok) continue;
          const j = await res.json();
          if (typeof j.log === "string") setJobLog(j.log);
          if (j.state === "success") { setJobMsg(`${label} ✓`); return; }
          if (j.state === "error") { setJobMsg(`${label} ✗ — ${j.step} (rc=${j.returncode})`); return; }
          setJobMsg(`${label}… ${j.step ?? ""}`);
        }
      } catch (e) {
        setJobMsg(`${label} ✗ — ${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runId, runComplete],
  );

  const handlePreview = useCallback(() => {
    if (!runId || !runComplete || previewing) return;
    void runJob("preview-hardware", setPreviewing, s.btnPreview);
  }, [runId, runComplete, previewing, runJob, s.btnPreview]);

  const handleBuild = useCallback(() => {
    if (!runId || !runComplete || building) return;
    void runJob("build", setBuilding, s.btnBuild || "Build");
  }, [runId, runComplete, building, runJob]);

  const handleRunOnHardware = useCallback(() => {
    if (!runId || !runComplete || deploying || connectedCount === 0) return;
    void runJob("deploy", setDeploying, s.btnRunOnHardware);
  }, [runId, runComplete, deploying, connectedCount, runJob, s.btnRunOnHardware]);

  const hasAny = requirements || appPlan || report;
  const hasPrdContent = requirements || report;

  // Auto-switch from welcome → prd when content first arrives
  const prevHasAny = useRef(false);
  useEffect(() => {
    if (hasAny && !prevHasAny.current) setActiveTab((cur) => cur === "welcome" ? "prd" : cur);
    prevHasAny.current = !!hasAny;
  }, [hasAny]);

  // Auto-scroll the streamed job log to the newest line as it grows.
  useEffect(() => {
    const el = jobLogRef.current;
    if (el && jobLogOpen) el.scrollTop = el.scrollHeight;
  }, [jobLog, jobLogOpen]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-white/8 bg-white/2">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/8 bg-white/3 px-4 py-2.5 backdrop-blur-sm">
        <div className="size-2 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        <span className="text-sm font-medium tracking-wide">{s.previewCanvas}</span>
        {hasAny && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-300">
            <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
            {s.live}
          </span>
        )}
        {/* Action buttons — always visible top-right of canvas */}
        <div className={`flex items-center gap-2 ${hasAny ? "ml-2" : "ml-auto"}`}>
          {/* Preview — assemble system folder + launch slint-viewer on the daemon display */}
          <button
            type="button"
            disabled={!runId || !runComplete || previewing}
            onClick={handlePreview}
            title={!runId || !runComplete ? s.prdNotGenerated : undefined}
            className="flex items-center gap-1.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {previewing ? (
              <svg className="size-3.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2a6 6 0 0 1 0 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            )}
            {s.btnPreview}
          </button>
          {/* Build — compile Rust project */}
          <button
            type="button"
            disabled={!runId || !runComplete || building}
            onClick={handleBuild}
            title={!runId || !runComplete ? s.prdNotGenerated : undefined}
            className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {building ? (
              <svg className="size-3.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2a6 6 0 0 1 0 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2l4 4-4 4M10 6h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {building ? "Building..." : (s.btnBuild || "Build")}
          </button>
          {/* Run on Hardware */}
          <button
            type="button"
            disabled={!runId || !runComplete || connectedCount === 0 || deploying}
            onClick={handleRunOnHardware}
            title={!runId || !runComplete ? s.prdNotGenerated : connectedCount === 0 ? s.btnRunOnHardwareNoDevice : undefined}
            className="flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deploying ? (
              <svg className="size-3.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2a6 6 0 0 1 0 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="10" width="12" height="4" rx="1" />
                <path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {deploying ? s.btnDeploying : s.btnRunOnHardware}
          </button>
        </div>
      </div>

      {/* Deploy / hardware-preview job status + streamed log */}
      {jobMsg && (
        <div className="shrink-0 border-b border-white/8 bg-white/3">
          <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
            {jobLog && (
              <button
                type="button"
                onClick={() => setJobLogOpen((o) => !o)}
                className="rounded px-1 leading-none text-muted-foreground hover:text-foreground"
                title={jobLogOpen ? "收起日志" : "展开日志"}
              >
                {jobLogOpen ? "▾" : "▸"}
              </button>
            )}
            <span className="truncate">{jobMsg}</span>
            {jobLog && (
              <button
                type="button"
                onClick={() => { void navigator.clipboard?.writeText(jobLog); }}
                className="ml-auto shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] hover:bg-white/10"
                title="复制完整日志"
              >
                复制日志
              </button>
            )}
          </div>
          {jobLog && jobLogOpen && (
            <pre
              ref={jobLogRef}
              className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-white/8 bg-black/40 px-4 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              {jobLog}
            </pre>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-white/8 bg-white/2">
        <button
          type="button"
          onClick={() => setActiveTab("welcome")}
          className={`px-4 py-2.5 text-sm transition-all ${
            activeTab === "welcome"
              ? "border-b-2 border-purple-400 font-medium text-purple-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s.welcomeTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prd")}
          className={`px-4 py-2.5 text-sm transition-all ${
            activeTab === "prd"
              ? "border-b-2 border-purple-400 font-medium text-purple-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s.prdTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("slint")}
          className={`px-4 py-2.5 text-sm transition-all ${
            activeTab === "slint"
              ? "border-b-2 border-purple-400 font-medium text-purple-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s.uiTab}
        </button>
        {screenPngs.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("screens")}
            className={`px-4 py-2.5 text-sm transition-all ${
              activeTab === "screens"
                ? "border-b-2 border-purple-400 font-medium text-purple-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Screens ({screenPngs.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div data-slot="artifact-canvas" className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5">
        {activeTab === "welcome" ? (
          <WelcomeTab />
        ) : activeTab === "prd" ? (
          <>
            <UploadedImages images={uploadImages} />
            {hasPrdContent ? (
              <div className="space-y-6">
                {requirements && <PrdMarkdown raw={requirements} />}
                {report && (
                  <div className={requirements ? "border-t border-white/8 pt-5" : ""}>
                    <ReportMarkdown raw={report} runId={runId} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground/60 py-8">
                {s.prdNotGenerated}
              </div>
            )}
          </>
        ) : activeTab === "screens" ? (
          <ScreenGrid pngs={screenPngs} lapSystemDir={lapSystemDir} />
        ) : appPlan ? (
          <pre className="min-w-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-black/40 p-5 text-sm leading-relaxed text-emerald-300/90 shadow-inner">
            {appPlan}
          </pre>
        ) : (
          <div className="text-center text-sm text-muted-foreground/60 py-8">
            {s.slintNotGenerated}
          </div>
        )}
      </div>
    </div>
  );
}
