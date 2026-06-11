"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, homeCopy } from "../content";
import type { DisplayLocale } from "../types";
import { GuideLayer } from "./GuideLayer";
import { ProjectLayer } from "./ProjectLayer";
import { SettingsPanel } from "./SettingsPanel";

export function RedesignHome() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projectsClosing, setProjectsClosing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideClosing, setGuideClosing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [locale, setLocaleState] = useState<DisplayLocale>(DEFAULT_LOCALE);
  const content = homeCopy[locale];
  const projectsActive = projectsOpen || projectsClosing;
  const guideActive = guideOpen || guideClosing;

  const closeSettings = () => {
    setSettingsOpen(false);
    setLanguageOpen(false);
  };

  const setLocale = (nextLocale: DisplayLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  };

  const openProjects = () => {
    if (projectsOpen || projectsClosing || guideActive) return;
    closeSettings();
    setProjectsClosing(false);
    setProjectsOpen(true);
  };

  const closeProjects = () => {
    if (!projectsOpen || projectsClosing) return;
    setProjectsOpen(false);
    setProjectsClosing(true);
    window.setTimeout(() => setProjectsClosing(false), 440);
  };

  const openGuide = () => {
    if (guideOpen || guideClosing || projectsActive) return;
    closeSettings();
    setGuideClosing(false);
    setGuideOpen(true);
  };

  const closeGuide = () => {
    if (!guideOpen || guideClosing) return;
    setGuideOpen(false);
    setGuideClosing(true);
    window.setTimeout(() => setGuideClosing(false), 380);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as DisplayLocale | null;
    if (saved && homeCopy[saved]) setLocaleState(saved);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-redesign-settings-root]")) return;
      if (guideOpen) {
        closeGuide();
        return;
      }
      closeSettings();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (guideOpen) {
        closeGuide();
        return;
      }
      if (projectsOpen) {
        closeProjects();
        return;
      }
      closeSettings();
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [guideOpen, projectsOpen, projectsClosing, guideClosing]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.72),transparent_28%),radial-gradient(circle_at_78%_70%,rgba(255,90,10,0.05),transparent_24%),linear-gradient(180deg,#f4f5f6_0%,#eef0f2_100%)] text-black">
      <section
        className={[
          "pointer-events-none absolute left-1/2 top-[46%] w-[min(1280px,92vw)] -translate-x-1/2 -translate-y-1/2 text-center transition-[filter] duration-300",
          projectsActive ? "blur-[7px]" : "",
          guideActive ? "blur-[8px]" : "",
        ].join(" ")}
      >
        <h1
          className="m-0 whitespace-nowrap text-[76px] font-extrabold leading-[0.96] tracking-normal text-black max-lg:text-[64px] max-md:text-[48px] max-sm:whitespace-normal max-sm:text-[40px]"
          style={{ wordBreak: "keep-all", overflowWrap: "normal" }}
        >
          {content.title}
        </h1>
        <p className="mx-auto mt-[18px] max-w-[760px] text-[17px] leading-[1.8] text-black/55">
          {content.description}
        </p>
      </section>

      <section
        className={[
          "fixed bottom-[38px] left-1/2 z-20 w-[min(860px,calc(100vw-80px))] -translate-x-1/2 transition-[filter] duration-300",
          projectsActive ? "blur-[7px]" : "",
          guideActive ? "blur-[8px]" : "",
        ].join(" ")}
      >
        <div className="flex min-h-[70px] w-full items-center gap-3.5 rounded-full border border-black/6 bg-white/82 py-3 pl-6 pr-3.5 shadow-[0_20px_50px_rgba(15,18,24,0.06),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur-[22px]">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-black outline-none placeholder:text-black/40"
            placeholder={content.placeholder}
          />
          <label className="inline-flex h-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/6 bg-white/75 px-5 text-[15px] text-black/60 transition-[background,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/98">
            <span>{content.upload}</span>
            <input
              type="file"
              multiple
              accept=".ai,.psd,.html,.figma,.zip,.md,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => setFileCount(event.target.files?.length ?? 0)}
            />
          </label>
          <button
            type="button"
            title={content.generate}
            className="grid size-[46px] shrink-0 place-items-center rounded-full bg-[#ff5a0a] text-lg text-white shadow-[0_14px_30px_rgba(255,90,10,0.2)] transition-[background,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#ff6a20] hover:shadow-[0_16px_34px_rgba(255,90,10,0.26)]"
          >
            {content.generate}
          </button>
        </div>
        <div className="mt-2.5 text-center text-xs text-black/35">
          {fileCount > 0 ? content.selectedFiles(fileCount) : content.fileHint}
        </div>
      </section>

      <SettingsPanel
        content={content}
        locale={locale}
        setLocale={setLocale}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        languageOpen={languageOpen}
        setLanguageOpen={setLanguageOpen}
        openGuide={openGuide}
        muted={projectsActive || guideActive}
      />

      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); projectsOpen ? closeProjects() : openProjects(); }}
        className={[
          "fixed right-8 top-[30px] z-[120] h-10 w-[58px] cursor-pointer rounded-full shadow-[0_16px_36px_rgba(15,18,24,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-[18px] transition-[background,box-shadow,filter,transform,width] duration-300",
          projectsOpen ? "bg-[#ff5a0a]/95 text-white shadow-[0_0_36px_rgba(255,90,10,0.26),0_16px_38px_rgba(255,90,10,0.16)]" : "bg-white/84 text-black/35 hover:-translate-y-0.5 hover:scale-105 hover:bg-white/98",
          guideActive ? "pointer-events-none blur-[8px]" : "",
        ].join(" ")}
        aria-label={content.projects}
        title={content.projects}
      >
        <span
          className={[
            "absolute left-[15px] top-1/2 h-[3px] w-7 rounded-full bg-current transition-[background,transform] duration-300 before:absolute before:left-0 before:h-[3px] before:w-7 before:rounded-full before:bg-current before:transition-transform before:duration-300 before:content-[''] after:absolute after:left-0 after:h-[3px] after:w-7 after:rounded-full after:bg-current after:transition-transform after:duration-300 after:content-['']",
            projectsOpen ? "-translate-y-1/2 rotate-45 before:translate-y-0 before:rotate-90 after:translate-y-0" : "-translate-y-1/2 before:-translate-y-2 after:translate-y-2",
          ].join(" ")}
        />
      </button>

      <ProjectLayer open={projectsOpen} closing={projectsClosing} content={content} onClose={closeProjects} />
      <GuideLayer open={guideOpen} closing={guideClosing} content={content} onClose={closeGuide} />
    </main>
  );
}
