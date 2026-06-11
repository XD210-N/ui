"use client";

import { useMemo } from "react";
import { useProjectContext } from "@/app/ProjectContext";
import type { HomeCopy } from "../types";
import { ProjectPreview } from "./ProjectPreview";

interface ProjectLayerProps {
  open: boolean;
  closing: boolean;
  content: HomeCopy;
  onClose: () => void;
}

export function ProjectLayer({ open, closing, content, onClose }: ProjectLayerProps) {
  const { projects, openProject, loading } = useProjectContext();
  const visibleProjects = useMemo(() => projects.slice(0, 14), [projects]);
  const active = open || closing;

  return (
    <div
      className={[
        "fixed inset-0 z-[100] transition-opacity duration-300",
        active ? "opacity-100" : "pointer-events-none opacity-0",
        open ? "pointer-events-auto" : "",
      ].join(" ")}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#f4f5f6]/45 backdrop-blur-[12px]" />
      <section
        className={[
          "absolute right-1/2 top-[78px] h-[calc(100vh-148px)] w-[min(1180px,calc(100vw-140px))] origin-top-right translate-x-1/2 overflow-y-auto overscroll-contain rounded-[32px] border border-black/6 bg-white/78 px-7 pb-[34px] pt-[26px] shadow-[0_36px_100px_rgba(15,18,24,0.08),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-[28px] transition-[opacity,transform]",
          open ? "translate-y-0 scale-x-100 scale-y-100 opacity-100 duration-[580ms] ease-[cubic-bezier(0.16,1.08,0.26,1)]" : "-translate-y-[34px] scale-x-[0.92] scale-y-[0.08] opacity-0 duration-[420ms] ease-[cubic-bezier(0.62,0,0.42,1)]",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-[-26px] z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.82),rgba(255,255,255,0.46),transparent)] px-0 pb-[22px] pt-1 backdrop-blur-xl">
          <h2 className="m-0 text-[25px] font-semibold tracking-normal text-black">{content.projectTitle}</h2>
          <p className="mt-[7px] text-sm text-black/45">{content.projectDesc}</p>
        </header>

        {loading ? (
          <div className="grid h-48 place-items-center text-sm text-black/45">{content.loading}</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-[26px] p-1 pb-5 md:grid-cols-3 lg:grid-cols-4">
            {visibleProjects.map((project, index) => (
              <article
                key={project.project_id}
                className="group cursor-pointer transition-[filter,transform] duration-300 ease-[cubic-bezier(0.18,1.26,0.42,1)] hover:z-10 hover:scale-[1.08] hover:drop-shadow-[0_22px_30px_rgba(15,18,24,0.12)]"
              >
                <button
                  type="button"
                  onClick={() => { void openProject(project.project_id); onClose(); }}
                  className="block w-full text-left"
                >
                  <ProjectPreview index={index} />
                  <p className="mx-1 mt-2.5 truncate text-sm font-semibold text-black/70">
                    {project.name || content.projectNamePrefix + " " + String(index + 1)}
                  </p>
                  <p className="mx-1 mt-1 text-xs text-black/35">
                    {project.last_opened_at ? content.recent : content.unopened}
                  </p>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
