# OmniStack UI - 前后端接手分析

> ⚠️ **布局描述已过时（2026-06-13）**：本文"中间主区 + 左右抽屉"是**项目化重构前**的旧布局，已被「全屏画布 + 悬浮窗 + 形态切换」取代。当前以 `项目化交互重构执行方案.md`、`给下一个AI的接手提示.md` 为准；本文仅"约束/真实连接/待确认"等原则仍有效。

## 1. 当前结论

当前 `app/redesign` 是“真实功能接线 + 新布局”的版本，不是纯 mock demo。

已接入的关键能力包括：

- `ProjectProvider`
- `ProjectGate`
- `MyRuntimeProvider`
- `Thread`
- `ArtifactCanvas`
- `ProjectSwitcher`
- `ThreadListPrimitive`
- `useLocale()` / `useSetLocale()`

当前界面结构是：

- 中间主区
- 左侧项目/历史抽屉
- 右侧预览抽屉
- 左下角项目入口
- 左侧设置入口
- 设置里的语言子菜单
- 设置里的说明书视频弹窗

默认语言是 `zh-TW`，语言入口是 5 种：

- `zh-TW`
- `zh`
- `en`
- `ja`
- `ko`

## 2. 最重要的约束

1. 不模拟甲方后端没有返回的数据。
2. 不把假数据混进真实 runtime。
3. 不把核心组件用静态卡片替掉。
4. 不把 `Thread`、`ArtifactCanvas`、`Composer` 卸载掉。
5. 如果某功能暂时还没想好放哪里，先保留在首页、抽屉或当前面板中。

## 3. 当前已知的真实连接

- 发送与线程历史由 `MyRuntimeProvider` 管
- 预览与工件由 `canvasStore` / `ArtifactCanvas` 管
- 项目切换由 `ProjectContext` / `ProjectSwitcher` 管
- 语言切换由 `strings-context` + `localStorage` 管
- `/redesign` 当前使用新的布局壳，但底层仍然依赖原工程真实逻辑

## 4. 仍需确认的点

下面这些内容属于“甲方后端还在施工”阶段，不能默认已经完整：

- 项目数据是否最终由真实后端持久化
- 线程归档 / 删除 / 重命名菜单是否要在 UI 暴露
- `ArtifactCanvas` 相关的硬件、构建、部署接口是否都已在甲方后端完备
- 说明书视频的真实资源路径
- langgraph SSE 字段名：mock 用 `content`，需与甲方真实后端确认是否一致（见 `临时MOCK后端说明.md`）

> 注：明暗主题切换已接完（redesign 自管，暗色为占位配色），不再是待确认项。

当前做法：

- 能接真实接口的先接真实接口
- 接不了的先保留空状态 / 占位，不编造

## 5. 交接建议

后续如果继续做视觉重构，顺序建议是：

1. 先确认功能入口没有丢
2. 再继续收敛布局
3. 再补主题和更细的视觉
4. 再根据甲方后端进度补完整接口

## 6. 阅读优先级

新的接手者先读：

1. `app/redesign/MD/修改代码注意事项.md`
2. `app/redesign/MD/原工程代码修改说明.md`
3. 本文件

