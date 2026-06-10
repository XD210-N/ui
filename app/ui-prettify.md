# UI 重新设计指南

本应用使用双层组件架构。设计师可以在不涉及逻辑、运行时或状态代码的情况下重新设计整个 UI。

---

## 应该修改什么，不应该修改什么

| 文件 / 区域                                          | 可修改?          | 原因                                      |
| ---------------------------------------------------- | ---------------- | ----------------------------------------- |
| `packages/ui/src/components/assistant-ui/*.tsx`      | **是**           | 聊天 UI 组件 — 原始组件的样式包装         |
| `packages/ui/src/components/ui/*.tsx`                | **是**           | 通用组件（Button, Dialog, Tooltip 等）    |
| `apps/omnistack-ui/app/globals.css`                  | **是**           | 所有颜色、字体、间距、深色模式 — CSS 变量 |
| `apps/omnistack-ui/app/page.tsx`                     | **是（仅布局）** | 侧边栏和页面壳 — 直接使用原始组件         |
| `packages/react/src/primitives/`                     | **否**           | 仅行为的无头组件，此处无样式              |
| `apps/omnistack-ui/app/MyRuntimeProvider.tsx`        | **否**           | 后端连接，无 UI                           |
| `packages/store/`, `packages/core/`, `packages/tap/` | **否**           | 状态管理，无 UI                           |

---

## 第 1 层 — 页面壳 (`page.tsx`)

侧边栏和页面布局直接在 `page.tsx` 中使用原始组件：

```tsx
// 原始组件提供交互和状态 — 自由地重新设计 classNames
<ThreadListPrimitive.Root className="...">
  <ThreadListPrimitive.New className="..." />
  <ThreadListPrimitive.Items>
    {() => (
      <ThreadListItemPrimitive.Root className="...">
        <ThreadListItemPrimitive.Trigger className="...">
          <ThreadListItemPrimitive.Title fallback="新建线程" />
        </ThreadListItemPrimitive.Trigger>
      </ThreadListItemPrimitive.Root>
    )}
  </ThreadListPrimitive.Items>
  <ThreadListPrimitive.LoadMore className="..." />
</ThreadListPrimitive.Root>
```

**规则：** 保持 `*Primitive.*` 组件名称和任何非 className 属性不变。仅更改 Tailwind 类和周围的 HTML 结构。

外层网格布局：

```tsx
<main className="grid h-dvh grid-cols-[260px_1fr]">
  <aside className="...">...</aside>
  <ThreadWithSuggestions />
</main>
```

改变 `260px` 来调整侧边栏宽度，将 `grid` 改为 `flex` 等。

---

## 第 2 层 — 聊天组件 (`packages/ui/src/components/assistant-ui/`)

这些是主要的聊天 UI 文件。每个文件都用 Tailwind 类包装一个原始组件：

| 文件                                     | 呈现的内容                         |
| ---------------------------------------- | ---------------------------------- |
| `thread.tsx`                             | 完整的聊天线程 — 消息 + 滚动视口   |
| `composer.tsx`（或在 `thread.tsx` 内部） | 消息输入栏                         |
| `markdown-text.tsx`                      | 消息中呈现的 markdown              |
| `reasoning.tsx`                          | 思路链 / 推理块                    |
| `attachment.tsx`                         | 文件/图像附件                      |
| `tool-fallback.tsx`                      | 工具调用显示                       |
| `thread-list.tsx`                        | 线程列表（侧边栏列表的可重用版本） |

**示例模式** — 仅需更改 `className` 值：

```tsx
// thread.tsx（简化）
import { ThreadPrimitive } from "@assistant-ui/react"; // ← 不要修改

export const Thread = () => (
  <ThreadPrimitive.Root className="aui-root aui-thread-root @container flex h-full flex-col bg-background">
    <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4">
      <ThreadPrimitive.Messages ... />
    </ThreadPrimitive.Viewport>
    <Composer />
  </ThreadPrimitive.Root>
);
```

---

## 第 3 层 — 颜色、字体、间距 (`globals.css`)

所有视觉标记都是 CSS 自定义属性。覆盖其中任何一个即可重新主题化整个应用，无需修改组件：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
  /* ... 更多变量 ... */
}

.dark {
  /* 深色模式覆盖 */
}
```

还有作用域组件变量（可以放在包装元素或 CSS 中）：

```css
.aui-thread-root {
  --thread-max-width: 42rem;
  --composer-radius: 1rem;
}
```

---

## 可用的 Tailwind 插件

两个动画插件已预安装，可以在任何 className 中使用：

### tw-glass — 磨砂玻璃效果

```tsx
<div className="glass glass-strength-40">...</div>
```

工具类：`glass`、`glass-strength-{value}`，控制模糊、饱和度、亮度和色差。

### tw-shimmer — 加载闪烁效果

```tsx
<div className="shimmer">...</div>
```

可通过元素上的 CSS 变量配置：

```css
--shimmer-speed: 2s;
--shimmer-color: oklch(0.9 0 0);
--shimmer-spread: 40%;
```

---

## 设计师通常的做法

| 方法                   | 工作方式                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Figma → 开发者交接** | 设计师在 Figma 中工作；开发者实现。最常见。                                                                             |
| **AI 辅助编辑**        | 设计师用纯英文向 Copilot/Cursor 描述更改；AI 编写 Tailwind/JSX。对此堆栈非常有效。                                      |
| **学习 Tailwind 类**   | Tailwind 接近 CSS — `bg-red-500` = `background: red`，`px-4` = `padding-left/right: 1rem`。设计师可以在一天内学到足够。 |
| **仅 CSS 变量**        | 所有颜色、字体和间距都在 `globals.css` 中作为 CSS 变量。设计师*可以*直接编辑该文件 — 这是纯 CSS。                       |

---

## 无需 React 知识就可以安全修改的内容

1. **`globals.css`** — CSS 自定义属性（`--background`、`--foreground`、`--primary` 等）。纯 CSS，无需 React。
2. **`.tsx` 文件中的 Tailwind `className` 字符串** — 读起来像简写 CSS。从仓库自己的指南中的规则：*保持 `*Primitive._`组件名称不变，仅更改`className` 值和周围的 HTML 结构。_
3. **`components/ui/`** — shadcn/ui 组件。大多是包装 HTML 元素的类字符串。

---

## 设计师推荐工作流程

1. 打开 [`app/globals.css`](app/globals.css) — 更改颜色/字体变量 → 立即看到视觉效果。
2. 对于布局/间距，用纯英文向 GitHub Copilot Chat（此窗口）描述更改。它将编辑正确的 `className` 字符串。
3. 保持实时开发服务器运行（`npm run dev`）和浏览器打开 — 更改会立即热重载。

该仓库甚至有一个 [ui-prettify.md](app/ui-prettify.md) 精确映射哪些文件可以修改，哪些不能。

---

## 即插即用工作流

1. 设计师克隆仓库（或在分支中工作）。
2. 在 `packages/ui/src/components/assistant-ui/`、`packages/ui/src/components/ui/`、`globals.css` 和 `page.tsx` 的布局部分中工作。
3. 从 `apps/omnistack-ui/` 运行 `pnpm dev` 进行实时预览。
4. 打开 PR — 无需后端、无需状态、无需运行时更改。

应用通过路径别名导入样式化组件：

```
@/components/assistant-ui/* → packages/ui/src/components/assistant-ui/*
@/components/ui/*           → packages/ui/src/components/ui/*
```

所以只需将文件放回 `packages/ui/src/` 即可。
