// ⚠️ 临时 MOCK（PR 前删除整个文件 / 见《甲方对接与模拟说明.md》）
//
// 甲方 ArtifactCanvas 的 WelcomeTab「生成配对码」按钮调 POST `${SAAS_URL}/v1/pair-code`，
// 解析返回的 PairCodeResult 显示给用户用于配对真实设备：
//   { pair_code, expires_at, pair_url, daemon_command, device_name }
// 甲方真后端生成真实配对码 + 有效期。本 mock 仅为本地演示前端展示逻辑，返回固定假配对码。
//
// 注：crypto/Date 在本路由可用（Next 服务端运行时），故直接用真实时间生成有效期。

import { NextResponse } from "next/server";

export function POST() {
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 分钟后过期
  return NextResponse.json({
    pair_code: "MOCK-8421",
    expires_at: expires,
    pair_url: "https://example.local/pair/MOCK-8421",
    daemon_command: "omnistack-daemon pair --code MOCK-8421",
    device_name: "模拟设备 Mock-Device",
  });
}
