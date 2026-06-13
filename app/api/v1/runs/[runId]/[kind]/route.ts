// ⚠️ 临时 MOCK（PR 前删除整个文件 / 见《甲方对接与模拟说明.md》）
//
// 甲方 ArtifactCanvas 的三个按钮（预览 / 构建 / 在硬件运行）通过 runJob 调用：
//   POST `${SAAS_URL}/v1/runs/{runId}/{kind}`  启动任务（kind: preview-hardware | build | deploy）
//   GET  同一地址  每 2s 轮询，解析 { state, step, log, returncode }：
//        state==="success" → 成功；state==="error" → 失败(读 step, returncode)；否则视为进行中
// 甲方真后端跑的是 scripts/lap/*.py（assemble-system-folder / preview-slint / package / flash 等），
// 是连真实开发板的后台作业。本 mock 仅为本地演示前端"启动→轮询→日志滚动→成功"的状态流转，
// 不连任何硬件，按 runId+kind 在内存里推进几步后返回 success。

type JobState = {
  step: string;
  log: string;
  polls: number;
  state: "running" | "success" | "error";
};

// 进程级内存，按 `${runId}:${kind}` 记录每个任务的推进进度。重启 dev server 即清空。
const g = globalThis as unknown as { __mockJobs?: Map<string, JobState> };
const jobs = (g.__mockJobs ??= new Map<string, JobState>());

const STEPS: Record<string, string[]> = {
  "preview-hardware": ["assemble-system-folder", "preview-slint"],
  build: ["cargo-build", "package"],
  deploy: ["init-workspace", "package", "flash"],
};

function key(runId: string, kind: string) {
  return `${runId}:${kind}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ runId: string; kind: string }> },
) {
  const { runId, kind } = await params;
  // 启动：重置该任务进度
  jobs.set(key(runId, kind), {
    step: (STEPS[kind]?.[0]) ?? "starting",
    log: `[mock] ${kind} 任务已启动 (run ${runId})\n`,
    polls: 0,
    state: "running",
  });
  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string; kind: string }> },
) {
  const { runId, kind } = await params;
  const k = key(runId, kind);
  const job = jobs.get(k);

  if (!job) {
    // 没有启动记录：当作进行中（前端会继续轮询）
    return Response.json({ state: "running", step: "pending", log: "" });
  }

  const steps = STEPS[kind] ?? ["working"];
  job.polls += 1;

  if (job.polls < steps.length + 1) {
    // 推进到下一步，日志追加一行
    const idx = Math.min(job.polls, steps.length) - 1;
    job.step = steps[Math.max(0, idx)];
    job.log += `[mock] 步骤完成：${job.step}\n`;
    job.state = "running";
  } else {
    job.step = "done";
    job.log += `[mock] ${kind} 全部步骤完成 ✓\n`;
    job.state = "success";
  }
  jobs.set(k, job);

  return Response.json({
    state: job.state,
    step: job.step,
    log: job.log,
    returncode: job.state === "success" ? 0 : undefined,
  });
}
