# MYWORK - redesign 当前工作记录

> ⚠️ **部分内容已过时（2026-06-13）**：本文 1-9 节描述的"中间主区 + 左右抽屉"布局是**项目化重构之前**的，现已被「全屏画布 + 悬浮窗 + 形态切换」取代。**最新状态以 `MD/给下一个AI的接手提示.md` 和 `MD/项目化交互重构执行方案.md` 为准。** 本文保留作历史记录，其"不卸载/不模拟/分层"等原则仍有效。

这个文件给后续接手者看，目的是让他在最短时间内知道：

1. 当前 redesign 已经做到哪里。
2. 哪些东西是绝对不能动的。
3. 后续继续改 UI 时应该遵守什么边界。

## 1. 当前状态

`/redesign` 已经不是“纯视觉原型”，而是把甲方原工程的真实功能接进来了。

当前实现大致是：

- 中间主区保留真实 `Thread`
- 左侧项目/历史栏做成左侧抽屉
- 右侧预览画布做成右侧抽屉
- 左下角有项目入口
- 左侧抽屉里有设置入口
- 设置里有语言子菜单和说明书入口
- 说明书是居中的毛玻璃弹窗，内部预留 `<video controls>`
- 设置里还有明暗主题开关（浅色 / 深色），状态持久化到 `localStorage`
- 默认语言是 `zh-TW`
- 语言入口是 5 种：`zh-TW / zh / en / ja / ko`
- 首页标题、副标题、按钮文案都已经走 `useStrings()`

## 2. 现在的代码分层

- `app/redesign/ui/`：只放布局和视觉（含 `useRedesignTheme.ts` 主题钩子）
- `app/redesign/bindings/`：只放真实功能接线
- `app/redesign/MD/`：放约束、说明、改动记录

核心绑定已经接着原工程的真实能力：

- `ProjectProvider`
- `ProjectGate`
- `MyRuntimeProvider`
- `ProjectSwitcher`
- `ThreadListPrimitive`
- `Thread`
- `ArtifactCanvas`
- `useLocale()` / `useSetLocale()`

## 3. 不能破坏的底线

1. 只改界面，不改功能链路。
2. 不模拟后端数据。
3. 不用假组件替换真组件。
4. 不删入口。
5. 不把核心组件从 React 树里卸载。
6. 后端没完善的能力，不要自己编造，先保留空状态或占位。
7. 不确定放哪儿的功能，先放到首页、抽屉或当前面板里，别删。

## 4. 当前已经实现的设计方向

- 首页尽量简洁
- 左右辅助区默认收起
- 左下角按钮控制左侧项目/历史抽屉
- 点击对话区空白处可以收回左侧抽屉
- 右上角按钮控制右侧预览画布抽屉
- 右侧展开时，中间区域压缩
- 右侧关闭时，`ArtifactCanvas` 仍然挂载

## 5. 语言与文案

当前语言体系已经扩成 5 种，默认繁体 `zh-TW`。  
首页中间标题、副标题、设置按钮、说明书按钮、上传按钮都应该继续从 `lib/strings.ts` 读，不要在页面里硬编码。

## 5.1 明暗主题（重要：别改成屎山）

主题切换是 redesign 自管的，**没有用 `next-themes`**，这是有意为之，原因和约束如下：

- **作用域只在 redesign 子树**：主题通过 `AppShell` 根节点的 `data-theme` 属性应用，颜色全部走 `.redesign-shell` 里的 CSS 变量。绝对不要把主题逻辑提到根 `app/layout.tsx` 的 `<html>` 上——那会波及甲方原前端，违反「只改界面不破坏原架构」的底线。
- **逻辑收敛在一个钩子**：`app/redesign/ui/useRedesignTheme.ts` 封装了 state、`localStorage` 持久化（键 `omnistack-redesign-theme`）和 `toggleTheme`。`AppShell` 只调用钩子，不内联主题逻辑。
- **配色集中在变量块**：亮色是 `.redesign-shell` 的默认变量值（保持原视觉，未改动）；暗色是 `.redesign-shell[data-theme="dark"]` 的一套变量。所有 `.aui-*` 和外壳元素都引用 `var(--...)`，不写死颜色。
- **暗色当前是占位配色**（深灰底 + 橙色主色）。甲方给正式暗色配色后，**只改 `[data-theme="dark"]` 那一块变量即可**，不用动任何组件结构。

后续扩展主题（跟随系统、更多主题）只改 `useRedesignTheme.ts` 和变量块两处，不要散落到组件里。

## 6. 如果接手者要继续改

先读这几个文件：

1. `app/redesign/MD/修改代码注意事项.md`
2. `app/redesign/MD/原工程代码修改说明.md`
3. `C:\XD\03 其它文件存储\00 个人文档\工作相关\数字动力\260612 2 甲方要求梳理.md`
4. `C:\XD\03 其它文件存储\00 个人文档\工作相关\数字动力\260612 3 前端代码结构梳理.md`
5. `C:\XD\03 其它文件存储\00 个人文档\工作相关\数字动力\260612 4 前端功能内容.md`

## 7. 以后如果改了原工程文件

任何 `app/redesign` 外的改动，都必须继续写进：

- `app/redesign/MD/原工程代码修改说明.md`

不要只改代码，不写记录。

## 8. 当前建议的推进顺序

1. 先保住真实功能接线。
2. 再继续细调左右抽屉的展开和收回。
3. ~~再补主题切换。~~ ✅ 已完成（见 5.1 节）
4. 再补更多语言或设置项。
5. 最后再做更细的视觉统一。

## 9. 最终目标

最终不是做一个 demo，而是做一个能覆盖到甲方工程里的前端版本。  
所以每次改动都要记住：

- 功能先于视觉
- 接线先于样式
- 保留先于删改
- 真实对接先于 mock

## 10. 本次会话进展（2026-06-13）

### 已完成

0. **甲方上一版反馈 5 项已全部真实接线**（发送按钮 / 对话运行时 / ArtifactCanvas 预览 / 文件上传 / 线程历史），逐项核对见 `MD/反馈.md` 顶部状态表。
1. **多语言 ja/ko 补译**：`lib/strings.ts` 里 `ja`、`ko` 继承 `...en`，补齐了之前漏的 5 个字段（`composerAriaLabel`/`sendMessageAriaLabel`/`stopGeneratingAriaLabel`/`scrollToBottom`/`edit`）。zh-TW 继承 `...zh` 覆盖为繁体。
2. **明暗主题切换**（见 5.1 节）：新增 `app/redesign/ui/useRedesignTheme.ts` 钩子，`AppShell` / `SettingsDock` / `ManualModal` 颜色全改用 CSS 变量，暗色为占位配色，集中在 `.redesign-shell[data-theme="dark"]`。
3. **文档整理**：`原工程代码修改说明.md` 去重重排，按文件分章；2026-06-13 经两工程对比修订（补 en 文案改动、更正 mock 还原方式）。
4. **临时 mock 后端**：调试期曾在甲方自带的 `app/api/` mock 上动过，详见下方「mock 当前状态」。
5. **AI 回复字段 bug 修正（永久）**：甲方 mock `langgraph/route.ts` 发 `text`、前端 `MyRuntimeProvider` 读 `content`，发/读不一致导致助手正文空白。已把 mock 改为发 `content`，符合甲方前端既定契约。记入 `MD/原工程代码修改说明.md`，**不在 PR 删除清单**。
6. **右侧预览抽屉自动拉出（交付功能）**：甲方原版画布常驻三列、内容一到即可见；新版收进默认关闭的右抽屉。已在 `app/redesign/ui/AppShell.tsx` 订阅甲方 `canvasStore`，当 `runComplete && screenPngs.length>0`（分析完成出图）的上升沿触发时自动 `setRightOpen(true)`。只在上升沿触发一次，用户手动关闭后不强制重开；新对话 `clearCanvas` 会重置，下轮可再次自动拉出。不碰甲方 `ArtifactCanvas`。

### ⚠️ mock 当前状态（第二轮：为验证预览效果再次启用，PR 前删除）

为本地验证「预览渲染 + 自动拉出」，再次启用了临时 mock。**交付前必须删除**：

- `.env.local`（新建置空 SAAS_URL）→ 删除。
- `app/api/langgraph/route.ts` 内 `// ⚠️ 临时 MOCK` ~ `// 临时 MOCK 区块结束` 之间补发的 `state`/`done(screen_pngs)` → 删除，改回甲方原版空 `done`。**保留** `text` 事件的 `content` 字段修正（见已完成第 5 条）。
- 整个 `app/api/v1/runs/` 目录（占位图路由）→ 删除。

完整删除清单与永久保留项见 `MD/临时MOCK后端说明.md` 顶部。

> 注：`app/api/_mock/store.ts`、`open/route.ts` 第一轮曾改后又还原，第二轮未再动，与甲方原版一致。

