# OmniStack UI - 项目说明文档

> ⚠️ **布局描述已过时（2026-06-13）**：本文的"中间主区 + 左抽屉 + 右抽屉"是**项目化重构之前**的旧布局，现已被「全屏画布 + 悬浮窗 + 形态切换」取代。**当前布局以 `项目化交互重构执行方案.md` 和 `给下一个AI的接手提示.md` 为准**；本文仅"关键原则"一节仍有效。

## 当前状态

这是 `/redesign` 的当前真实状态说明，不是早期三列静态原型。

- 已接入真实 `ProjectProvider`
- 已接入真实 `ProjectGate`
- 已接入真实 `MyRuntimeProvider`
- 已接入真实 `Thread`
- 已接入真实 `ArtifactCanvas`
- 已接入真实语言切换体系
- 默认语言是 `zh-TW`
- 语言入口是 `zh-TW / zh / en / ja / ko`
- 首页改成中间主区 + 左抽屉 + 右抽屉
- 左下角有项目入口
- 左侧抽屉里有设置入口
- 设置里有语言子菜单和说明书入口
- 说明书弹窗是毛玻璃视频壳，内部预留 `<video controls>`
- 设置里有明暗主题开关（redesign 自管，未用 next-themes，暗色为占位配色）
- 首页标题、副标题、设置文案、上传文案都走 `useStrings()`
- 甲方上一版反馈的 5 个缺失项（发送 / 运行时 / 预览 / 上传 / 历史）已全部真实接线（核对见 `反馈.md` 顶部）

## 关键原则

1. 只改布局和视觉，不破坏现有功能连接。
2. 不主动模拟甲方后端未返回的数据。
3. 后端缺内容时，前端保留空状态或占位，不伪造。
4. `Thread`、`ArtifactCanvas`、`Composer`、`MyRuntimeProvider` 不能通过条件渲染直接卸载。
5. 如果暂时想不到某个入口放哪里，先放在首页、抽屉或当前面板里，不要删掉。

## 当前代码组织

```text
app/redesign/
  page.tsx
  RedesignHome.tsx
  bindings/
  ui/
  MD/
```

### bindings

负责把原工程真实能力接进来：

- `RuntimeBinding.tsx`
- `ProjectBinding.tsx`
- `ThreadListBinding.tsx`
- `ThreadBinding.tsx`
- `ArtifactBinding.tsx`
- `LocaleBinding.tsx`

### ui

只负责：

- 布局
- 视觉
- 动画
- 抽屉
- 弹窗
- 按钮位置

不负责重写业务逻辑。

## 后续接手顺序

1. 先读 `修改代码注意事项.md`
2. 再读 `原工程代码修改说明.md`
3. 再看当前 `RedesignHome.tsx`、`AppShell.tsx`、各个 binding
4. 需要改原工程文件时，先确认是否真有必要
5. 改了原工程文件就补记录，不要漏写

## 备注

历史分析内容如果与当前实现冲突，以本文件顶部的“当前状态”为准。

