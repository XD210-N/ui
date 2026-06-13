// ⚠️ 临时 MOCK（PR 前删除整个文件 / 见《甲方对接与模拟说明.md》）
//
// 甲方 ArtifactCanvas 的 WelcomeTab 每 10s 轮询 `${SAAS_URL}/v1/boards`，
// 解析 { supported: SupportedBoard[], connected: ConnectedProxy[] }：
//   - supported → 渲染"支持的硬件"列表（用户在此选择目标板，写入 boardStore）
//   - connected → 已连接设备；其数量决定"在硬件运行"按钮是否可用（connectedCount>0 才可点）
// 甲方真后端由 lap_mcp 探测真实开发板返回。本 mock 仅为本地演示前端渲染与按钮可用态，
// 返回固定的假板子 + 一个假已连接设备。字段严格对齐甲方 interface 定义。

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    supported: [
      {
        id: "FD_F1_R88R30_ADB_SPINOR",
        display_name: "F1 智能面板 (SPI NOR)",
        arch: "riscv",
        description: "模拟开发板 · 480x480 智能面板",
        resolution: "480x480",
      },
      {
        id: "FD_F1_R88R30_ADB_SPINAND",
        display_name: "F1 智能面板 (SPI NAND)",
        arch: "riscv",
        description: "模拟开发板 · 480x480 智能面板",
        resolution: "480x480",
      },
    ],
    connected: [
      {
        proxy_id: "mock-proxy-001",
        device_name: "模拟设备 Mock-Device",
        project_name: "Demo Project",
        model: "F1-R88R30",
        soc: "R88R30",
        screen_size: { width: 480, height: 480 },
        project_id: "demo-project",
        boards: ["FD_F1_R88R30_ADB_SPINOR"],
      },
    ],
  });
}
