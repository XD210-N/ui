"use client";

import { ArtifactCanvas, WelcomeTab } from "@/app/ArtifactCanvas";

export function RedesignArtifactCanvas() {
  return <ArtifactCanvas />;
}

// 硬件设置面板：复用甲方 WelcomeTab（支持的硬件 / 已连接设备 / 配对码），
// 供 redesign 的「硬件设置」弹窗使用。不重写逻辑，直接用真实组件。
export function RedesignHardwarePanel() {
  return <WelcomeTab />;
}
