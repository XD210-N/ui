import { appendMessages, getThread } from "@/app/api/_mock/store";

// SSE event format the frontend expects: "data: <json>\n\n"
function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

const MOCK_REPLY = `Hello! I'm the **OmniStack UI mock backend**.

This is a preview-only mode — no real AI is running. The UI layout, styles, and interactions are fully functional so a designer can work on them without connecting to the real backend.

Here's what you can explore:

- **Thread list** in the sidebar — create, rename, archive threads
- **Project switcher** — create and switch between projects  
- **Artifact canvas** on the right — shows PRD / output panels
- **Composer** — type messages, attach files, send

> To connect to the real backend, set \`NEXT_PUBLIC_SAAS_URL\` in \`.env.local\`.
`;

async function streamReply(
  controller: ReadableStreamDefaultController,
  userText: string,
  threadId: string,
  userId: string,
) {
  const msgId = Math.random().toString(36).slice(2);

  // Stream the reply word by word with a small delay.
  // 前端 MyRuntimeProvider 读取的是 event.content（不是 text），字段名必须一致。
  // 此处为修正甲方 mock 原本的字段笔误（永久保留，非临时 mock）。
  const words = MOCK_REPLY.split(" ");
  let accumulated = "";
  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    controller.enqueue(sseEvent({ type: "text", content: word + " " }));
    await new Promise((r) => setTimeout(r, 18));
  }

  // ⚠️ 临时 MOCK（PR 前删除本段，到 "临时 MOCK 区块结束" 注释为止）：
  // 模拟甲方真后端预计返回的"完整预览流"，用于本地验证右侧画布渲染与自动拉出。
  // 甲方原版 mock 只发空 done、不发 state/screen_pngs，所以本地看不到预览效果。
  controller.enqueue(
    sseEvent({
      type: "state",
      run_id: "mock-run-001",
      requirements:
        "## 需求概要（模拟）\n- 目标设备：480x480 智能面板\n- 首页展示天气与时间\n- 支持深浅色切换",
      app_plan:
        "## 实现方案（模拟）\n1. 顶部状态栏\n2. 中部天气卡片\n3. 底部导航三按钮",
      report:
        "# 生成报告（模拟 report.md）\n\n本报告由模拟后端生成，用于验证前端渲染。\n\n## 截图\n\n![screen](screens/screen_1.png)\n\n生成完成。",
    }),
  );

  controller.enqueue(
    sseEvent({
      type: "done",
      run_id: "mock-run-001",
      screen_pngs: ["screen_1.png", "screen_2.png"],
      lap_system_dir: "Agent-Build/app_mock-run-001",
    }),
  );
  // 临时 MOCK 区块结束 —— PR 前删除上面这两段 state / done(screen_pngs)，
  // 改回甲方原版的：controller.enqueue(sseEvent({ type: "done" }));

  // Persist to in-memory history
  const lgThreadId = `${userId}:${threadId}`;
  appendMessages(lgThreadId, [
    {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: [{ type: "text", text: userText }],
    },
    {
      id: msgId,
      role: "assistant",
      content: [{ type: "text", text: accumulated }],
    },
  ]);

  controller.close();
}

export async function POST(req: Request) {
  let userText = "";
  let threadId = "";
  let userId = "anonymous";

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart")) {
    const form = await req.formData();
    userText = (form.get("text") as string) ?? "";
    threadId = (form.get("threadId") as string) ?? "";
    userId = (form.get("userId") as string) ?? "anonymous";
  } else {
    const body = await req.json() as { text?: string; threadId?: string; userId?: string };
    userText = body.text ?? "";
    threadId = body.threadId ?? "";
    userId = body.userId ?? "anonymous";
  }

  const stream = new ReadableStream({
    async start(controller) {
      await streamReply(controller, userText, threadId, userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
