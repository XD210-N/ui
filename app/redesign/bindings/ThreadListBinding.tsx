"use client";

import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { useStrings } from "@/lib/strings-context";

export function RedesignThreadList() {
  const s = useStrings();

  return (
    <ThreadListPrimitive.Root className="flex flex-col gap-0.5 overflow-y-auto">
      <ThreadListPrimitive.New className="mb-1 flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground transition-colors hover:bg-white/10">
        <span className="text-xs">+</span> {s.newThread}
      </ThreadListPrimitive.New>
      <ThreadListPrimitive.Items>
        {() => (
          <ThreadListItemPrimitive.Root className="flex h-9 items-center rounded-lg transition-colors hover:bg-white/8 data-active:bg-white/10">
            <ThreadListItemPrimitive.Trigger className="flex-1 truncate px-3 text-start text-sm text-muted-foreground data-active:text-foreground">
              <ThreadListItemPrimitive.Title fallback={s.newThread} />
            </ThreadListItemPrimitive.Trigger>
          </ThreadListItemPrimitive.Root>
        )}
      </ThreadListPrimitive.Items>
      <ThreadListPrimitive.LoadMore className="mt-1 h-9 rounded-lg border border-white/8 px-3 text-sm text-muted-foreground transition-colors hover:bg-white/8 disabled:opacity-30">
        {s.loadMore}
      </ThreadListPrimitive.LoadMore>
    </ThreadListPrimitive.Root>
  );
}
