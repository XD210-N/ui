"use client";

import { useCallback, useEffect, useState } from "react";

export type RedesignTheme = "light" | "dark";

const THEME_STORAGE_KEY = "omnistack-redesign-theme";
const DEFAULT_THEME: RedesignTheme = "light";

function isTheme(value: unknown): value is RedesignTheme {
  return value === "light" || value === "dark";
}

/**
 * Redesign 专用的明暗主题状态。
 *
 * 主题主作用域是 redesign 子树（通过 AppShell 的 data-theme 应用），
 * 同时把当前主题同步到 <html data-redesign-theme>，供 ProjectProvider
 * 这类渲染在 shell 外的弹层做颜色覆盖；不使用 next-themes。
 * 主题相关的 state / 持久化 / 切换逻辑全部收敛在此，便于后续扩展
 * （例如新增「跟随系统」或更多主题）时只改这一处。
 */
export function useRedesignTheme() {
  const [theme, setTheme] = useState<RedesignTheme>(DEFAULT_THEME);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(saved)) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.redesignTheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((value) => {
      const next: RedesignTheme = value === "light" ? "dark" : "light";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
