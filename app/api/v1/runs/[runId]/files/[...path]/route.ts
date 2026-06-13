// ⚠️ 临时 MOCK（PR 前删除整个 app/api/v1/runs/ 目录）
//
// 甲方原工程的 ArtifactCanvas 通过 `${SAAS_URL}/v1/runs/{runId}/files/screens/{png}`
// 拉取后端生成的界面图。甲方真后端会提供这个端点；本路由仅为本地验证预览渲染，
// 返回一张带文件名标注的占位 SVG，让 ScreenGrid / report 里的 <img> 能显示出来。
//
// 真后端对接时无需本路由——删除即可，前端 img 的 src 会指向真实后端。

export function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string; path: string[] }> },
) {
  return params.then(({ runId, path }) => {
    const name = path?.[path.length - 1] ?? "screen.png";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f2430"/>
      <stop offset="1" stop-color="#0d0e10"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" fill="url(#g)"/>
  <rect x="24" y="24" width="432" height="432" rx="20" fill="none" stroke="#ff5a13" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="240" y="220" fill="#ff5a13" font-family="sans-serif" font-size="28" font-weight="700" text-anchor="middle">MOCK 预览界面</text>
  <text x="240" y="262" fill="#9aa0a8" font-family="monospace" font-size="18" text-anchor="middle">${name}</text>
  <text x="240" y="300" fill="#6b7077" font-family="monospace" font-size="13" text-anchor="middle">run: ${runId}</text>
</svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  });
}
