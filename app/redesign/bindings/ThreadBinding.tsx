"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AuiProvider, Suggestions, useAui } from "@assistant-ui/react";
import { useStrings } from "@/lib/strings-context";

export function RedesignThread() {
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
