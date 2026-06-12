"use client";

import type { ReactNode } from "react";
import { MyRuntimeProvider } from "@/app/MyRuntimeProvider";
import {
  ProjectGate,
  ProjectProvider,
  useProjectContext,
} from "@/app/ProjectContext";

type RedesignRuntimeBindingProps = {
  children: ReactNode;
};

export function RedesignRuntimeBinding({
  children,
}: RedesignRuntimeBindingProps) {
  return (
    <ProjectProvider>
      <RedesignProjectedRuntime>{children}</RedesignProjectedRuntime>
    </ProjectProvider>
  );
}

function RedesignProjectedRuntime({ children }: RedesignRuntimeBindingProps) {
  const { activeProject } = useProjectContext();

  return (
    <ProjectGate>
      <MyRuntimeProvider
        key={activeProject?.project_id}
        projectId={activeProject?.project_id ?? "default"}
      >
        {children}
      </MyRuntimeProvider>
    </ProjectGate>
  );
}
