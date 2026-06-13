"use client";

/**
 * backendMode —— redesign 层的「真实 / 模拟」后端切换器。
 *
 * 目的：给甲方一个可视化开关，在不改甲方任何对接逻辑（MyRuntimeProvider /
 * ProjectContext 源码一字不动）的前提下，运行时决定请求落到真后端还是本地 mock。
 *
 *   real（默认）：所有 /v1/* 与 /langgraph/* 请求都指向甲方的 NEXT_PUBLIC_SAAS_URL。
 *                 —— 这同时修复了甲方原工程「项目请求走相对路径被 rewrite 拐进自带
 *                    mock」的问题（见 MD/甲方对接与模拟说明.md 头号排查项）：本模式
 *                    会把项目相对请求也补成 SAAS_URL 绝对地址，与线程/对话一致到真后端。
 *   mock：把上述请求都改成相对路径 → 经甲方自带 next.config.ts rewrite 命中 app/api
 *         下的本地 mock，用于本地看效果 / 给甲方当对接参照。
 *
 * 机制：monkey-patch 全局 fetch（仅 redesign 页面装载），按当前模式重写请求 URL。
 * 切换模式 = 写 localStorage + 整页 reload（让项目/线程基于新后端重新初始化）。
 *
 * ⚠️ 本文件及切换 UI 属「诊断版」内容。甲方确认真实链路 OK 后，可整体移除得到纯净版
 *    （移除步骤见 MD/甲方对接与模拟说明.md）。real 模式不依赖本拦截器也能工作，
 *    但保留它能让项目相对请求自动指向真后端，省去甲方改 ProjectContext / rewrite。
 */

export type BackendMode = "real" | "mock";

const MODE_STORAGE_KEY = "omnistack-backend-mode";

// 与甲方原代码一致的取值方式（MyRuntimeProvider.tsx / ArtifactCanvas.tsx）。
const RAW_SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL;
const SAAS_URL = RAW_SAAS_URL ?? "http://localhost:8000";

/**
 * 默认模式：真实。
 * - 默认「真实」，便于甲方直接覆盖到真后端对接测试。
 * - 若用户手动切到「模拟」，请求会回落到本地 mock。
 * 无论默认是什么，用户都能用设置面板的按钮手动切换（存 localStorage 覆盖默认）。
 */
const DEFAULT_MODE: BackendMode = "mock";

/** 供 UI 作为 SSR/首屏一致的初值用（客户端再用 getBackendMode 从 localStorage 校正）。 */
export const defaultBackendMode: BackendMode = DEFAULT_MODE;

function isMode(v: unknown): v is BackendMode {
  return v === "real" || v === "mock";
}

export function getBackendMode(): BackendMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
  return isMode(saved) ? saved : DEFAULT_MODE;
}

/** 切换并刷新（刷新是必须的：让 ProjectProvider / MyRuntimeProvider 基于新后端重建状态）。 */
export function setBackendMode(mode: BackendMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  window.location.reload();
}

// 需要被接管的 API 前缀（相对路径形式）。
const API_PREFIXES = ["/v1/", "/langgraph/", "/langgraph", "/v1"];

function hasApiPrefix(path: string): boolean {
  return (
    path.startsWith("/v1/") ||
    path === "/v1" ||
    path.startsWith("/langgraph/") ||
    path === "/langgraph"
  );
}

/**
 * 按模式重写一个请求 URL 字符串，返回新的 URL（无关请求原样返回）。
 * 仅处理 /v1/* 与 /langgraph/*；其它（如占位图、静态资源）不动。
 */
function rewriteUrl(input: string): string {
  const mode = getBackendMode();

  // 解析出「相对于站点根的 path 部分」。input 可能是绝对（含 SAAS_URL）或相对。
  let path: string | null = null;
  let isAbsolute = false;

  if (SAAS_URL && input.startsWith(SAAS_URL)) {
    path = input.slice(SAAS_URL.length) || "/";
    isAbsolute = true;
  } else if (input.startsWith("/")) {
    path = input;
  } else {
    // 其它绝对地址（http 开头但非 SAAS_URL，或 data: 等）—— 不接管。
    return input;
  }

  if (!hasApiPrefix(path)) return input;

  if (mode === "mock") {
    // 模拟：强制相对路径，经 rewrite 命中本地 mock。去掉 SAAS_URL 前缀即可。
    return path;
  }

  // real：强制指向甲方真后端。相对路径补上 SAAS_URL；已是绝对的原样。
  if (isAbsolute) return input;
  if (!SAAS_URL) return input; // SAAS_URL 为空时无法补全，退回相对（甲方需配置 env）
  return `${SAAS_URL}${path}`;
}

let installed = false;

/** 在 redesign 页面顶层调用一次，patch 全局 fetch。重复调用安全。 */
export function installBackendModeInterceptor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        const nextUrl = rewriteUrl(input);
        return originalFetch(nextUrl, init);
      }
      if (input instanceof URL) {
        const nextUrl = rewriteUrl(input.toString());
        return originalFetch(nextUrl, init);
      }
      if (input instanceof Request) {
        const newUrl = rewriteUrl(input.url);
        if (newUrl === input.url) return originalFetch(input, init);
        // URL 变了：用新 URL 重建 Request，保留原请求的方法/头/体等。
        return originalFetch(new Request(newUrl, input), init);
      }
    } catch {
      /* 重写出错则退回原始 fetch，绝不影响请求本身 */
    }
    return originalFetch(input as RequestInfo | URL, init);
  };
}
