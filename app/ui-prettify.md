# UI Redesign Guide

This app uses a two-tier component architecture. A designer can restyle everything without touching any logic, runtime, or state code.

---

## What to touch vs. what to leave alone

| File / Area | Touch? | Why |
|---|---|---|
| `packages/ui/src/components/assistant-ui/*.tsx` | **Yes** | Chat UI components — styled wrappers around primitives |
| `packages/ui/src/components/ui/*.tsx` | **Yes** | General components (Button, Dialog, Tooltip, etc.) |
| `apps/omnistack-ui/app/globals.css` | **Yes** | All colors, fonts, spacing, dark mode — CSS variables |
| `apps/omnistack-ui/app/page.tsx` | **Yes (layout only)** | Sidebar and page shell — uses primitives directly |
| `packages/react/src/primitives/` | **No** | Behavior-only headless components, no styling here |
| `apps/omnistack-ui/app/MyRuntimeProvider.tsx` | **No** | Backend connection, no UI |
| `packages/store/`, `packages/core/`, `packages/tap/` | **No** | State management, no UI |

---

## Layer 1 — The page shell (`page.tsx`)

The sidebar and page layout live directly in `page.tsx` using primitives:

```tsx
// Primitives provide interaction + state — restyle the classNames freely
<ThreadListPrimitive.Root className="...">
  <ThreadListPrimitive.New className="..." />
  <ThreadListPrimitive.Items>
    {() => (
      <ThreadListItemPrimitive.Root className="...">
        <ThreadListItemPrimitive.Trigger className="...">
          <ThreadListItemPrimitive.Title fallback="New Thread" />
        </ThreadListItemPrimitive.Trigger>
      </ThreadListItemPrimitive.Root>
    )}
  </ThreadListPrimitive.Items>
  <ThreadListPrimitive.LoadMore className="..." />
</ThreadListPrimitive.Root>
```

**Rule:** keep the `*Primitive.*` component names and any non-className props unchanged. Only change Tailwind classes and HTML structure around them.

The outer grid layout:

```tsx
<main className="grid h-dvh grid-cols-[260px_1fr]">
  <aside className="...">...</aside>
  <ThreadWithSuggestions />
</main>
```

Change `260px` to widen/narrow the sidebar, swap `grid` for `flex`, etc.

---

## Layer 2 — Chat components (`packages/ui/src/components/assistant-ui/`)

These are the main chat UI files. Each one wraps a primitive with Tailwind classes:

| File | What it renders |
|---|---|
| `thread.tsx` | Full chat thread — messages + scroll viewport |
| `composer.tsx` (or inside `thread.tsx`) | Message input bar |
| `markdown-text.tsx` | Rendered markdown in messages |
| `reasoning.tsx` | Chain-of-thought / reasoning blocks |
| `attachment.tsx` | File/image attachments |
| `tool-fallback.tsx` | Tool call display |
| `thread-list.tsx` | Thread list (reusable version of the sidebar list) |

**Example pattern** — only the `className` values need changing:

```tsx
// thread.tsx (simplified)
import { ThreadPrimitive } from "@assistant-ui/react"; // ← DO NOT TOUCH

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

## Layer 3 — Colors, fonts, spacing (`globals.css`)

All visual tokens are CSS custom properties. Override any of these to retheme the entire app without touching components:

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
  /* ... more variables ... */
}

.dark {
  /* dark mode overrides */
}
```

Also scoped component variables (can be placed on the wrapper element or in CSS):

```css
.aui-thread-root {
  --thread-max-width: 42rem;
  --composer-radius: 1rem;
}
```

---

## Available Tailwind plugins

Two animation plugins are pre-installed and ready to use in any className:

### tw-glass — frosted glass surfaces

```tsx
<div className="glass glass-strength-40">...</div>
```

Utilities: `glass`, `glass-strength-{value}`, controls blur, saturation, brightness, and chromatic aberration.

### tw-shimmer — loading shimmer effect

```tsx
<div className="shimmer">...</div>
```

Configurable via CSS variables on the element:
```css
--shimmer-speed: 2s;
--shimmer-color: oklch(0.9 0 0);
--shimmer-spread: 40%;
```

---

## Drop-in workflow

1. Designer clones the repo (or works in a branch).
2. Works in `packages/ui/src/components/assistant-ui/`, `packages/ui/src/components/ui/`, `globals.css`, and the layout section of `page.tsx`.
3. Runs `pnpm dev` from `apps/omnistack-ui/` to preview live.
4. Opens a PR — no backend, no state, no runtime changes required.

The app imports styled components via path alias:
```
@/components/assistant-ui/* → packages/ui/src/components/assistant-ui/*
@/components/ui/*           → packages/ui/src/components/ui/*
```

So dropping files back into `packages/ui/src/` is all that's needed.
