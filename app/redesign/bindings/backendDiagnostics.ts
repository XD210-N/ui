"use client";

/**
 * backendDiagnostics —— 真实模式连不上后端时的诊断数据源。
 *
 * 列出甲方前端所有「需要连后端」的接口，逐个探测连通性，并对失败项附上
 * 「前端当前怎么对接的 + 甲方该怎么改」说明，供诊断弹窗展示。
 *
 * 探测只在「真实模式」下做：用 SAAS_URL 绝对地址直接请求（拦截器对绝对地址
 * 原样放行）。判定：能拿到任何 HTTP 响应（含 4xx/5xx）= 连通（后端在，可能只是
 * 该端点逻辑/数据问题）；fetch 直接抛错（Failed to fetch / 超时）= 连不上。
 */

const SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:8000";

export type EndpointStatus = "ok" | "fail" | "pending";

export type EndpointSpec = {
  key: string;
  label: string; // 中文用途
  method: "GET" | "POST";
  path: string; // 相对路径，探测时拼 SAAS_URL
  caller: string; // 甲方前端哪个文件调用
  howWired: string; // 前端当前怎么对接的
  fixHint: string; // 失败时甲方该怎么改
  probePath?: string; // 探测用的具体路径（带占位参数的端点用）
};

/** 甲方前端需要连后端的接口清单（探测顺序即展示顺序）。 */
export const ENDPOINT_SPECS: EndpointSpec[] = [
  {
    key: "projects",
    label: "项目列表 / 创建",
    method: "GET",
    path: "/v1/projects",
    caller: "app/ProjectContext.tsx",
    howWired:
      "前端用相对路径 fetch(`/v1/projects`)。注意：原工程此处是相对路径，会被 next.config.ts 的 rewrite 转去前端自带 mock，不会到真后端。真实模式下我方拦截器已把它补成 `${SAAS_URL}/v1/projects` 指向真后端。",
    fixHint:
      "贵方真后端需提供 GET/POST /v1/projects。若仍走自带 mock，请把 ProjectContext 改为绝对地址，或把 next.config.ts rewrite 的 destination 指向真后端。",
  },
  {
    key: "threads",
    label: "对话线程列表 / 历史",
    method: "GET",
    path: "/v1/threads",
    caller: "app/MyRuntimeProvider.tsx",
    howWired:
      "前端用 fetch(`${SAAS_URL}/v1/threads?userId=...&projectId=...`)，绝对地址直连真后端。",
    fixHint:
      "贵方真后端需提供 GET /v1/threads（按 userId/projectId 过滤），返回 { threads: [{remoteId,status,title}], nextCursor }。",
    probePath: "/v1/threads",
  },
  {
    key: "langgraph",
    label: "发消息 / AI 回复（SSE 流）",
    method: "POST",
    path: "/langgraph",
    caller: "app/MyRuntimeProvider.tsx",
    howWired:
      "前端 POST `${SAAS_URL}/langgraph`，读 SSE 流，按 text/state/done/error 事件渲染。助手文字读 event.content。",
    fixHint:
      "贵方真后端需提供 POST /langgraph 返回 SSE 流；助手文字事件用字段 content（不是 text），否则正文为空。state 带 requirements/app_plan/report，done 带 screen_pngs。",
  },
  {
    key: "boards",
    label: "硬件列表",
    method: "GET",
    path: "/v1/boards",
    caller: "app/ArtifactCanvas.tsx (WelcomeTab)",
    howWired:
      "前端每 10s GET `${SAAS_URL}/v1/boards`，解析 { supported, connected }。connected 数量决定“在硬件运行”按钮是否可用。",
    fixHint:
      "贵方真后端需提供 GET /v1/boards，返回 { supported: SupportedBoard[], connected: ConnectedProxy[] }。",
  },
  {
    key: "pair-code",
    label: "设备配对码",
    method: "POST",
    path: "/v1/pair-code",
    caller: "app/ArtifactCanvas.tsx (WelcomeTab)",
    howWired:
      "“生成配对码”按钮 POST `${SAAS_URL}/v1/pair-code`，解析 PairCodeResult 显示。",
    fixHint:
      "贵方真后端需提供 POST /v1/pair-code，返回 { pair_code, expires_at, pair_url, daemon_command, device_name }。",
  },
];

export type ProbeResult = {
  spec: EndpointSpec;
  status: EndpointStatus;
  detail: string; // 探测得到的状态码或错误简述
};

/** 探测单个端点：能拿到响应即视为连通。 */
async function probeOne(spec: EndpointSpec): Promise<ProbeResult> {
  const url = `${SAAS_URL}${spec.probePath ?? spec.path}`;
  try {
    // 用 GET 做轻量连通性探测（即便端点是 POST，能连通的后端通常会回 404/405，
    // 这同样证明“连得上”）。加超时避免长时间挂起。
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      spec,
      status: "ok",
      detail: `已连通（HTTP ${res.status}）`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = /abort/i.test(msg);
    return {
      spec,
      status: "fail",
      detail: aborted ? "连接超时（4s 无响应）" : `连不上：${msg}`,
    };
  }
}

/** 探测全部端点，返回结果数组。 */
export async function probeEndpoints(): Promise<ProbeResult[]> {
  return Promise.all(ENDPOINT_SPECS.map(probeOne));
}

/** 当前真实后端地址（展示用）。 */
export function getProbeBaseUrl(): string {
  return SAAS_URL || "(未配置 NEXT_PUBLIC_SAAS_URL)";
}
