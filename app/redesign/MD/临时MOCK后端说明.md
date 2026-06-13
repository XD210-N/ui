# 临时 MOCK 后端说明（⚠️ 当前已启用临时 mock，PR 前必须删除）

> ⚠️ 状态（2026-06-13）：**为本地验证「对话→AI回复→生成需求/方案/报告/界面图→右侧自动拉出」+「硬件预览/构建/部署/配对」效果，启用了临时 mock。交付甲方前必须删除。**
>
> ### 📌 完整删除清单 + 每处为什么模拟 + 甲方怎么改回 → 见 [`甲方对接与模拟说明.md`](./甲方对接与模拟说明.md)
>
> 那份文档是**写给甲方**的唯一对接/还原总览（含所有临时 mock 端点）。本文件只做内部速查。
>
> ### PR 前删除清单（速查）
>
> 1. `app/api/langgraph/route.ts` 内 `// ⚠️ 临时 MOCK` ~ `// 临时 MOCK 区块结束` 段 → 删除，改回空 `done`
> 2. `app/api/v1/runs/[runId]/files/[...path]/route.ts`（占位图）→ 删除
> 3. `app/api/v1/runs/[runId]/[kind]/route.ts`（预览/构建/部署任务）→ 删除
> 4. `app/api/v1/boards/route.ts`（硬件列表）→ 删除
> 5. `app/api/v1/pair-code/route.ts`（配对码）→ 删除
> 6. `backendMode.ts` + `backendDiagnostics.ts` + `BackendDiagnosticsModal.tsx` + SettingsDock 切换按钮 + AppShell 诊断触发 + page.tsx 的 `installBackendModeInterceptor()`（真实/模拟切换器 + 连接诊断面板，诊断工具）→ 可选删除，保留不影响真实模式
>
> 注：`.env.local` **已删除**，模拟/真实改由切换器控制。当前交付版默认真实；需要查看 mock 参照时可用设置面板按钮手动切换。
>
> ### ✅ 永久保留（不要删）
>
> - `app/api/langgraph/route.ts` 里 `type:"text"` 字段 `text`→**`content`**（修正甲方 mock 与前端 `MyRuntimeProvider` 读 `event.content` 的契约不一致 bug）。
> - `app/redesign/ui/AppShell.tsx` 订阅 canvasStore 自动拉出右抽屉（纯前端交互，交付内容）。

---

## 历史记录（第一轮：mock 曾全部还原，仅供回溯）

> 下面是第一轮把 mock 全部还原时的记录。当前（顶部）为验证效果又启用了临时 mock，以顶部为准。

## ‼️ 重要更正（2026-06-13 经两工程对比修订）

之前版本的本文件写「mock 是我们新增的，还原时删掉整个 `app/api/` 目录」。
**这是错的，照做会删掉甲方代码。**

经与甲方原始工程 `C:\XD\Git\mycode\pro_011\1ui-main\ui-main` 逐文件对比，确认：

- **`app/api/` 这整套 mock 路由是甲方原始工程自带的**，不是我们新增的。
- **`next.config.ts` 的 rewrite**（`/v1/* → /api/v1/*`、`/langgraph/* → /api/langgraph/*`）也是原始工程自带的，我们没动。
- 我们**只改了 `app/api/` 下的 3 个文件** + `.env.local`。

所以还原 = 把这 3 个文件改回原始工程的版本 + 还原 `.env.local`，**绝不是删目录**。

## 背景

真实后端是独立的 SAAS 服务（预期跑在 `NEXT_PUBLIC_SAAS_URL`，`.env.example` 默认 `http://localhost:8000`），当前仍在开发，本地没有可用端口。

前端有两条数据通路：

- **项目接口**：`app/ProjectContext.tsx` 用相对路径 `/v1/projects`，经 `next.config.ts` 的 rewrite 命中 `/api/v1/*`。
- **线程 / langgraph 接口**：`app/MyRuntimeProvider.tsx` 用绝对地址 `${SAAS_URL}/v1/threads`、`${SAAS_URL}/langgraph`。

原始工程已带 `app/api/` 下的内存 mock，本地不连真实后端也能跑。我们在此基础上做了下面 3 处修补，让进入项目内部的链路也能在 mock 下走通。

## 改了什么（相对甲方原始工程）

> 以下文件**原本就存在于甲方工程**，我们只是修改了内容。还原即改回原版。

### 1. `app/api/_mock/store.ts` —— 新增 `openOrCreateProject()` 兜底

原始版本只有 `openProject()`：找不到 id 返回 `null`（→ 上层 404）。
我们**新增**了一个函数（未删改原有函数）：

```ts
export function openOrCreateProject(projectId: string): Project {
  const existing = projects.get(projectId);
  if (existing) {
    existing.last_opened_at = now();
    return existing;
  }
  const p: Project = {
    project_id: projectId,
    name: "Recovered Project",
    user_id: "demo-user",
    created_at: now(),
    last_opened_at: now(),
  };
  projects.set(projectId, p);
  return p;
}
```

原因：浏览器 `localStorage` 会残留上次会话的项目 id，而内存 store 随 server 重启已清空，旧 id 失效会让前端卡在 404。兜底后无论残留什么旧 id 都能进入。

### 2. `app/api/v1/projects/[projectId]/open/route.ts` —— 改用兜底

```ts
// 原版
import { openProject } from "@/app/api/_mock/store";
const project = openProject(projectId);
if (!project) return NextResponse.json({ detail: "Not found." }, { status: 404 });
```

改为：

```ts
import { openOrCreateProject } from "@/app/api/_mock/store";
const project = openOrCreateProject(projectId); // 找不到按该 id 新建，不再 404
```

### 3. `app/api/langgraph/route.ts` —— 修正 SSE 字段名（契约 bug）

```ts
// 原版：前端读不到正文
controller.enqueue(sseEvent({ type: "text", text: word + " " }));
```

改为：

```ts
controller.enqueue(sseEvent({ type: "text", content: word + " " }));
```

前端 `MyRuntimeProvider.tsx`（约 514 行）读取的是 `event.content`，原版发的是 `text`，导致助手回复正文渲染为空。

> 注意：本条**修正的是甲方原始 mock 里就存在的字段名 bug**。还原时如果改回 `text`，mock 下助手回复又会空白——这是甲方真实后端是否同样用 `content` 的问题，交付时需与甲方确认后端实际字段，而非机械改回。

### 4. `.env.local` —— 置空 SAAS_URL（原工程无此文件，是我们新建）

原始工程没有 `.env.local`。我们新建并置空 `NEXT_PUBLIC_SAAS_URL`：

```
NEXT_PUBLIC_SAAS_URL=
```

留空后 `${SAAS_URL}/v1/threads` 变成相对路径 `/v1/threads`，与项目接口一样走 rewrite 命中 mock，避免绝对地址带来的偶发跨域 / host 不一致。真实后端地址见 `.env.example`（`http://localhost:8000`）。

## 还原步骤（PR / 交付前执行）

本工程**不是 git 仓库**，无法 `git checkout`，但可对照甲方原始工程 `C:\XD\Git\mycode\pro_011\1ui-main\ui-main` 还原：

1. 用原始工程的版本覆盖这 3 个文件：
   - `app/api/_mock/store.ts`
   - `app/api/v1/projects/[projectId]/open/route.ts`
   - `app/api/langgraph/route.ts`（⚠️ 见上文第 3 条，字段名需先与甲方后端契约对齐再决定）
2. 删除 `.env.local`，或把 `NEXT_PUBLIC_SAAS_URL` 改回真实后端地址（参考 `.env.example`）。
3. **不要删除 `app/api/` 目录**——它属于甲方原工程。

## 未改动（确认无需还原）

- `next.config.ts` —— 与原始工程逐字节相同，rewrite 是原工程自带。
- `app/MyRuntimeProvider.tsx`、`app/ProjectContext.tsx` —— 与原始工程相同，未改任何逻辑。
- `app/redesign/` 内文件 —— 全是我们新增，与 mock 无关。

---

## ⚠️ 历史排查记录（mock 模式下的问题，已还原故不再适用）

> 下面这段是 mock 模式下遇到的 `Unexpected token '<'` 问题现场。**现已还原为直连真实后端，此问题属于 mock 链路，不影响交付。** 保留仅供日后若再启用本地 mock 调试时参考。

兜底、env、字段 bug 修正都已就位，但上一会话用户反馈**仍可能进不去**。最后一次现场信息：

- 报错：`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- 日志：`POST /v1/projects/<id>/open 404 in 131ms`

已确认的事实（用这些缩小范围，别重复验证）：

1. **env 已生效**：请求 URL 是相对路径 `/v1/projects/...`，不再带 `http://localhost:3001`。
2. **路由已命中**：日志里有 `application-code`，说明请求进了 mock 路由代码。
3. **那条 404 是加兜底之前的**：加 `openOrCreateProject` 后理论上不该再 404。

### 下一步排查建议（按顺序）

1. **完全停掉 `npm run dev` 重启**（不是热重载），再看 `/v1/projects/<id>/open` 是否还 404。重启后应返回 200 + project JSON。
2. **清浏览器状态**：F12 Console 跑 `localStorage.clear()`，再 `Ctrl+Shift+R`。
3. **抓返回 HTML 的那一条请求**：`Unexpected token '<'` 是「把 HTML 当 JSON 解析」。F12 → Network 找返回 HTML / 红色的那条，看 URL + Status：
   - 仍带 `:3001` 或 `:8000` → 还有绝对地址没走 rewrite，env 未完全生效。
   - `/v1/...` 或 `/langgraph/...` 返回 404 HTML → 对应 mock 路由可能编译失败，看终端有无 `Failed to compile`。
4. **盯 `npm run dev` 终端编译错误**：任一 `route.ts` 编译失败，访问它都会返回 Next 错误 HTML 页 → 触发 `Unexpected token '<'`。

### 没验证到的部分（诚实标注）

- 兜底「重启后是否真的解决 404」**未经实测**，是基于代码逻辑的推断。
- `Unexpected token '<'` 到底来自哪个请求，**尚未拿到那条请求的 URL + 状态码**，是定位的关键缺口。下次务必先抓这条。
