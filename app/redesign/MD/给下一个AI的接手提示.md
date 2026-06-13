# 给下一个 AI 的接手提示（2026-06-13 最新）

> 本文件是**唯一权威入口**。你接手的是一个正在做「项目化交互重构」的 Next.js + React + Tailwind 前端。先完整读本文，再读下方指定文档，确认你分清了「甲方原代码」和「我方 redesign 代码」，再动手。

---

## 0. 一句话背景

- 甲方（数字动力）有一套面向工程师的测试前端。我方任务：**在不破坏任何功能与前后端对接的前提下，只改 UI 外观/布局/交互，做面向真实用户的体验优化**。
- 所有新 UI 在 `app/redesign/`。底层**复用甲方真实组件**（`MyRuntimeProvider` / `ProjectContext` / `ArtifactCanvas` / `Thread` / `canvasStore`），通过 `bindings/` 直接 import，不重写、不卸载。
- 交付遵循 **drop-in replacement**：代码覆盖回甲方工程要立刻能用。

## 1. 两个工程（务必分清）

- `C:\XD\Git\mycode\pro_011\1ui-main\ui-main` —— **甲方原始工程**（baseline，带 `1` 前缀）。还原/对比一律以此为准。
- `C:\XD\Git\mycode\pro_011\ui-main\ui-main` —— **当前在改的工程**（= 甲方原工程 + 我方 `app/redesign/`）。

## 2. ⚠️ 必读铁律（违反 = 破坏功能）

1. **只改 `app/redesign/ui/` + CSS + 必要的 `app/redesign/bindings/` 接线**；不改甲方组件内部逻辑。
2. **显隐一律用 CSS**（translate/opacity/display），**绝不用 `{条件 && <组件>}` 卸载** `Thread`/`ArtifactCanvas`/`MyRuntimeProvider`/`Composer`/`ProjectProvider`/`ProjectGate`/`ThreadListPrimitive`。
3. **接线只读已有 store、调已有方法**（canvasStore / useProjectContext），不自己 fetch、不造数据。
4. **改了 `app/redesign` 外的甲方文件，必须记录到 `MD/原工程代码修改说明.md`**。
5. 分阶段执行，**每阶段用户自行运行验证、说 OK 才进下一步**；未处理到的控件/窗口要继续显示能用。

## 3. 文档地图（按重要性，读这些）

**最新、最权威（先读）：**
- `MD/项目化交互重构执行方案.md` —— **当前主线任务**：5 阶段分步计划 + 进度追踪 + 编排转场时序。
- `MD/前端视觉交互修改方案手册.md` —— 「想改某视觉/交互 → 动哪个文件、怎么改不碰后端」的实操手册。表里没有的需求按文末流程补进去。
- `MD/修改代码注意事项.md` —— 硬性底线 + 已改甲方文件清单 + 第 11 节项目化重构需求。
- `MD/原工程代码修改说明.md` —— 所有改动甲方原文件的逐条记录（含总览表）。
- `MD/副界面四视图说明.md` —— 右侧 ArtifactCanvas 四视图（欢迎/需求文档/界面/Screens）的数据来源、时机、格式、关联控件。

**对接 / 模拟 / 待确认：**
- `MD/甲方对接与模拟说明.md` —— **写给甲方**的：所有 mock 端点、为什么模拟、怎么改回、真实/模拟切换器、连不上后端的头号排查项。
- `MD/我方需求与模拟对接策略.md` —— 我方模拟策略与边界（自证清白逻辑）。
- `MD/临时MOCK后端说明.md` —— 临时 mock 的 PR 前删除清单。
- `MD/待确认信息.md` —— **需问甲方的事项**（头号：真后端新用户是否有默认项目）。
- `MD/反馈.md` —— 甲方上一版反馈（已全部解决，附核对表）。

**⚠️ 已过时（布局描述是旧版，仅"原则"部分有效）：**
- `MD/PROJECT_OVERVIEW.md`、`MD/FRONTEND_ANALYSIS.md`、`MYWORK.md` —— 它们描述的是「中间主区+左抽屉+右抽屉」旧布局，**已被项目化重构取代**。布局以 `项目化交互重构执行方案.md` 为准；这三份只看其"不卸载/不模拟"等原则。

---

## 4. 我（上一个 AI）做了什么

### 4.1 修了甲方反馈的 5 项缺失（已全部真实接线）
发送按钮 / 对话运行时 / ArtifactCanvas 预览 / 文件上传 / 线程历史 —— 全部复用甲方真实组件接好。核对见 `反馈.md` 顶部。

### 4.2 改过 3 个甲方原文件（都只加属性/导出，不改逻辑，长期保留，已记档）
- `components/assistant-ui/thread.tsx`：Viewport 加 `autoScroll`（流式输出自动滚到底；甲方 `turnAnchor="top"` 时 autoScroll 默认 false）。
- `app/ArtifactCanvas.tsx`：`WelcomeTab` 加 `export`（供硬件设置弹窗复用）。
- `app/api/langgraph/route.ts`：`type:"text"` 字段 `text`→`content`（修甲方 mock 与前端读 `event.content` 的契约 bug）。
> 另有 4 个长期改动（多语言/品牌文案）：`lib/strings.ts`、`lib/strings-context.tsx`、`app/page.tsx`、`app/layout.tsx`。详见 `原工程代码修改说明.md`。

### 4.3 真实/模拟切换器 + 连接诊断（诊断版工具，可选保留）
- `bindings/backendMode.ts`：全局 fetch 拦截器，按模式重写 `/v1/*`、`/langgraph/*` 去向。**当前交付版默认真实**，需要排障时可手动切 mock。真实模式优先按 `NEXT_PUBLIC_SAAS_URL` 指向甲方后端。
- `ui/BackendModeFloating.tsx`：左上角模式胶囊 + 诊断入口。
- `ui/BackendDiagnosticsModal.tsx` + `bindings/backendDiagnostics.ts`：真实模式连不上时弹诊断面板，列各接口连通状态 + 前端怎么对接 + 甲方怎么改。
- 甲方本地无后端时用「模拟模式」看效果；mock 端点：`app/api/v1/boards`、`pair-code`、`runs/[runId]/[kind]`、`runs/[runId]/files/[...path]`、`langgraph`（含临时预览流）。

### 4.4 项目化交互重构（主线，进行中）
已完成阶段 0、1、2，详见 `项目化交互重构执行方案.md` 进度追踪。

---

## 5. 关键代码文件导览（redesign）

- `page.tsx`：装载 `installBackendModeInterceptor()`；渲染 `BackendModeFloating`（在 ProjectGate 外，连不上也能切模拟）+ `RedesignRuntimeBinding`。
- `RedesignHome.tsx`：把各 binding 作为 slot 传给 `AppShell`（projectSlot/threadListSlot/languageSlot/threadSlot/artifactSlot/hardwareSlot）。
- `ui/AppShell.tsx`：**核心布局壳**。形态状态（initial/project，订阅 canvasStore 的 hasContent 上升沿驱动）、聊天区转场、左右悬浮窗、画布、各浮动按钮、硬件设置弹窗、`<style jsx global>` 全部 CSS。**改视觉主要动这里**。
- `ui/InfiniteCanvas.tsx`：手写无边界画布（平移/滚轮缩放/网格自适应 + `CanvasItem` 可独立拖拽的钉图）。
- `ui/SettingsDock.tsx`：设置齿轮浮标（语言/主题/说明书）。
- `ui/ManualModal.tsx`：说明书毛玻璃弹窗。
- `bindings/*`：RuntimeBinding（ProjectProvider+Gate+MyRuntimeProvider）、ProjectBinding、ThreadBinding、ThreadListBinding、ArtifactBinding（含 RedesignHardwarePanel=复用 WelcomeTab）、LocaleBinding。

### 当前形态布局（项目态）
左侧聊天毛玻璃悬浮窗（缩小左移）+ 中间全屏无边界画布（图片钉其上）+ 右侧信息窗（ArtifactCanvas）+ 左上返回按钮 + 左下项目入口按钮 + 右侧信息窗内底部"硬件设置"按钮。初始态=全屏聊天 + 左上项目入口 + 左下设置齿轮。

### 临时演示开关（后续删）
AppShell 顶部"演示项目态切换"按钮 + `demoProject` 状态：无后端时手动切 initial↔project 看布局。正式由 canvasStore 内容驱动。

---

## 6. 后续规划（接着做）

按 `项目化交互重构执行方案.md` 的阶段推进：

- **阶段 3（下一步）**：需求文档独立悬浮窗 + 流式输出 + 收起/拽出。
  - prd（需求/报告）+ slint（方案文本）合并成右侧悬浮窗，标签切换。
  - done 时先浮现毛玻璃窗、流式输出文字、显示完再放图；后续内容直接流式追加。
  - 可关闭→拽回右下角极简控件→点控件拽出恢复。**只是视觉隐藏，组件不卸载。**
  - ⚠️ 甲方 `requirements`/`report`/`app_plan` 是每次 SSE `state` 整体替换（非逐字流），"流式逐字显示"要在 redesign 层自己做打字机动画（纯视觉）。
- **阶段 4**：Screens 图片接到 InfiniteCanvas，等需求文档流式完→以浮现动画出现在画布中央；左右悬浮窗半透明。
- **阶段 5（条件性）**：仅当甲方真后端新用户可能无默认项目时，才做"无项目新建引导"（见 `待确认信息.md` 第 1 条，优先问甲方）。

### 编排转场（贯穿 1/3/4 的连贯动画线）
Screens 生成（done）→ 聊天左移缩小 → 画布浮现 → 右侧需求文档流式 → 流式完图片弹出居中。详见执行方案「编排转场时序」。

## 7. 已知陷阱 / 注意点

- **默认走真实**：当前交付版默认真实模式，便于甲方直接覆盖测试。需要看本地对接参照时再手动切到 mock。
- **今早 404 根因（已查证）**：甲方项目请求 `/v1/projects` 走相对路径被 rewrite 拐进自带 mock，线程/对话走 `${SAAS_URL}` 真后端，两边项目 id 对不上。切换器真实模式已自动规避；纯净版需甲方改 ProjectContext 或 rewrite。详见 `甲方对接与模拟说明.md` 头号排查项。
- **过渡动画陷阱**：用 `transform`（GPU）而非 `inset`/`width` 做位移动画，避免插值跳变；CSS `calc(100%+x)` 缺空格会失效（用 inline style 或 `vw`）；多属性分拍用 `transition-delay`。
- **缩放/滚动**：InfiniteCanvas 滚轮缩放用非 passive 原生监听（`{passive:false}`）才能 preventDefault，否则触发浏览器整页缩放。viewport 加 `overscroll-behavior` 防整页橡皮筋。
- **PR 前清理**：临时 mock（boards/pair-code/runs/langgraph 预览流/切换器/诊断）按 `甲方对接与模拟说明.md` 清单删；保留 3 个甲方文件的长期改动（autoScroll / WelcomeTab export / langgraph content）。
- **不要碰**：`MyRuntimeProvider` / `ProjectContext` / `next.config.ts` / `canvasStore` 的逻辑（与甲方逐字节一致，除非记档并确有必要）。

## 8. 先做两件事

1. 重启 `npm run dev` 进 `/redesign`，确认能正常进入（默认真实），点"演示项目态切换"看形态布局，验证现状。
2. 读 `项目化交互重构执行方案.md`，从**阶段 3** 接着做；动手前先在 `前端视觉交互修改方案手册.md` 查改法，没有就先梳理安全改法再补进手册。
