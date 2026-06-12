"use client";

import { RedesignAppShell } from "./ui/AppShell";
import {
  RedesignArtifactCanvas,
  RedesignLanguageToggle,
  RedesignProjectSwitcher,
  RedesignThread,
  RedesignThreadList,
} from "./bindings";

export function RedesignHome() {
  return (
    <RedesignAppShell
      projectSlot={<RedesignProjectSwitcher />}
      threadListSlot={<RedesignThreadList />}
      languageSlot={<RedesignLanguageToggle />}
      threadSlot={<RedesignThread />}
      artifactSlot={<RedesignArtifactCanvas />}
    />
  );
}
