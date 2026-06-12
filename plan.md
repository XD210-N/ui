# Redesign Integration Plan

## Current State

Commit `673b610` added a redesigned home page at `/redesign`. It is currently a **visual prototype only** — the new UI does not replace the existing UI functionally.

---

## What the Redesign Is Missing

### ❌ Send button has no logic
The orange submit button in `RedesignHome.tsx` has no `onClick` handler. It does not call any runtime, trigger any LLM request, or do anything when clicked.

### ❌ No conversation runtime (Thread / MyRuntimeProvider)
The old UI wraps everything in `<MyRuntimeProvider>` which drives all LLM communication via `useExternalStoreRuntime` + LangGraph streaming. The redesign imports none of this — there is no message list, no streaming, no AI response rendering.

### ❌ No preview window (ArtifactCanvas)
The old UI renders `<ArtifactCanvas>` in a third column, which shows the live artifact/preview powered by `canvasStore`. The redesign has no canvas, no preview pane, and no way to trigger it.

### ❌ File upload is non-functional
The file input in the composer only increments a `fileCount` counter. The selected files are never passed to any attachment adapter or runtime.

### ❌ No conversation thread list / history
The old UI shows a sidebar with all threads via `ThreadListPrimitive`. The redesign has no history panel — past conversations are inaccessible.

### ❌ Guide links are placeholder
All `<a>` tags in `GuideLayer.tsx` use `href="javascript:void(0);"` — none link to real content.

---

## What Already Works in the Redesign

- ✅ Project list panel (`ProjectLayer`) — correctly calls `useProjectContext()` to fetch and open projects
- ✅ Language switcher — reads/writes locale to `localStorage`
- ✅ Animations and visual design

---

## Is the Existing Codebase Enough to Implement All Missing Features?

**Yes — all required building blocks exist in this workspace.** Nothing needs to be built from scratch:

| Missing Feature | Existing Code to Reuse |
|---|---|
| LLM send / streaming | `app/MyRuntimeProvider.tsx` — full runtime with auth, streaming, abort, retry |
| Message rendering | `components/assistant-ui/thread.tsx` — complete `<Thread>` component |
| Artifact / preview pane | `app/ArtifactCanvas.tsx` + `app/canvasStore.ts` |
| File attachments | `MyRuntimeProvider.tsx` already sets up `CompositeAttachmentAdapter` with `SimpleImageAttachmentAdapter` and `SimpleTextAttachmentAdapter` |
| Thread history list | `app/page.tsx` — `<ThreadList>` using `ThreadListPrimitive` |
| Project switching | `app/ProjectContext.tsx` — already consumed by redesign's `ProjectLayer` |
| Suggestions on new thread | `app/page.tsx` — `<ThreadWithSuggestions>` using `Suggestions()` from assistant-ui |
| i18n strings | `lib/strings.ts` + `lib/strings-context.tsx` |

### Integration approach

The cleanest path is to treat the redesign shell as the outer layout and mount the existing functional components inside it:

1. Wrap `RedesignHome` (or its page) with `<MyRuntimeProvider>` (keyed by `activeProject.project_id`), exactly as `page.tsx` does today.
2. Wire the composer's send button to `useComposer().send()` or `runtime.thread.append()`.
3. Pass selected files to the attachment adapter via `useComposer().attachFiles()`.
4. Render `<Thread>` (message list) in a panel/overlay that opens after the first message is sent.
5. Render `<ArtifactCanvas>` in the preview panel/overlay.
6. Add the thread list inside the existing projects or settings panel, or as a new sidebar.
