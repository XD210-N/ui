"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  AuiProvider,
  Suggestions,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
} from "@assistant-ui/react";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { ArtifactCanvas } from "./ArtifactCanvas";
import {
  ProjectGate,
  ProjectProvider,
  ProjectSwitcher,
  useProjectContext,
} from "./ProjectContext";
import { useStrings, useLocale, useSetLocale } from "@/lib/strings-context";
import type { Locale } from "@/lib/strings";

function LangToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <div className="flex items-center gap-1 border-t border-white/8 pt-2 mt-auto">
      {(["en", "zh"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`flex-1 rounded-md py-1 text-xs transition-colors ${
            locale === l
              ? "bg-white/15 text-foreground font-semibold"
              : "text-muted-foreground hover:bg-white/8"
          }`}
        >
          {l === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}

function ThreadList() {
  const s = useStrings();
  return (
    <ThreadListPrimitive.Root className="flex flex-col gap-0.5 overflow-y-auto">
      <ThreadListPrimitive.New className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:bg-white/10 transition-colors mb-1">
        <span className="text-xs">+</span> {s.newThread}
      </ThreadListPrimitive.New>
      <ThreadListPrimitive.Items>
        {() => (
          <ThreadListItemPrimitive.Root className="flex h-9 items-center rounded-lg hover:bg-white/8 data-active:bg-white/10 transition-colors">
            <ThreadListItemPrimitive.Trigger className="flex-1 truncate px-3 text-start text-sm text-muted-foreground data-active:text-foreground">
              <ThreadListItemPrimitive.Title fallback={s.newThread} />
            </ThreadListItemPrimitive.Trigger>
          </ThreadListItemPrimitive.Root>
        )}
      </ThreadListPrimitive.Items>
      <ThreadListPrimitive.LoadMore className="mt-1 h-9 rounded-lg border border-white/8 px-3 text-sm text-muted-foreground hover:bg-white/8 disabled:opacity-30 transition-colors">
        {s.loadMore}
      </ThreadListPrimitive.LoadMore>
    </ThreadListPrimitive.Root>
  );
}

function ThreadWithSuggestions() {
  const s = useStrings();
  const aui = useAui({
    suggestions: Suggestions(s.suggestions),
  });
  return (
    <AuiProvider value={aui}>
      <Thread />
    </AuiProvider>
  );
}

export default function Home() {
  return (
    <ProjectProvider>
      <ProjectedApp />
    </ProjectProvider>
  );
}

function ProjectedApp() {
  const { activeProject } = useProjectContext();
  const s = useStrings();
  return (
    <ProjectGate>
      <MyRuntimeProvider key={activeProject?.project_id} projectId={activeProject?.project_id ?? "default"}>
        <main className="grid h-dvh grid-cols-[260px_minmax(0,1fr)_minmax(0,3fr)] overflow-hidden bg-background">
          <aside className="flex flex-col gap-2 border-r border-white/8 bg-white/3 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/8 px-1 pb-3 mb-1">
              <img src="/os.jpg" alt="OmniStack UI logo" className="size-5 rounded-md flex-shrink-0 object-cover" />
              <span className="font-semibold text-sm tracking-wide">{s.appName}</span>
            </div>
            <ProjectSwitcher />
            <ThreadList />
            <LangToggle />
          </aside>
          <div className="h-full min-h-0 min-w-0 overflow-hidden">
            <ThreadWithSuggestions />
          </div>
          <div className="h-full min-h-0 min-w-0 overflow-hidden">
            <ArtifactCanvas />
          </div>
        </main>
      </MyRuntimeProvider>
    </ProjectGate>
  );
}
