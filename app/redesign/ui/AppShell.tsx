"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  FileText,
  Menu,
  PanelRightOpen,
  PanelLeftOpen,
  PanelRightClose,
  X,
} from "lucide-react";
import { useStrings } from "@/lib/strings-context";
import { getCanvasState, subscribeCanvas } from "@/app/canvasStore";
import { ManualModal } from "./ManualModal";
import { SettingsDock } from "./SettingsDock";
import { InfiniteCanvas, CanvasItem } from "./InfiniteCanvas";
import { useRedesignTheme } from "./useRedesignTheme";
import { ProjectDocumentPanel } from "./ProjectDocumentPanel";
import { defaultBackendMode, getBackendMode, type BackendMode } from "../bindings/backendMode";

const SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:8000";

type RedesignAppShellProps = {
  projectSlot: ReactNode;
  threadListSlot: ReactNode;
  languageSlot: ReactNode;
  threadSlot: ReactNode;
  artifactSlot: ReactNode;
  hardwareSlot: ReactNode;
};

export function RedesignAppShell({
  projectSlot,
  threadListSlot,
  languageSlot,
  threadSlot,
  artifactSlot,
  hardwareSlot,
}: RedesignAppShellProps) {
  const s = useStrings();
  const { theme, toggleTheme } = useRedesignTheme();
  const canvas = useSyncExternalStore(subscribeCanvas, getCanvasState, getCanvasState);

  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [rightInstant, setRightInstant] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [hardwareOpen, setHardwareOpen] = useState(false);
  const [enteredProject, setEnteredProject] = useState(false);
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [screenPreviewOpen, setScreenPreviewOpen] = useState(false);
  const [backendMode, setBackendModeState] = useState<BackendMode>(defaultBackendMode);
  const [lastScreens, setLastScreens] = useState<string[]>([]);
  const [lastRunId, setLastRunId] = useState("");
  const [failedScreenUrls, setFailedScreenUrls] = useState<Record<string, boolean>>({});

  const hasContent = !!(
    canvas.requirements || canvas.appPlan || canvas.report || canvas.runComplete || canvas.screenPngs.length > 0
  );

  useEffect(() => {
    if (!hasContent) return;
    setEnteredProject(true);
    setRightOpen(false);
    setDocumentOpen(true);
  }, [hasContent]);

  const projectMode = enteredProject;

  const liveRunId = useMemo(() => {
    return (
      canvas.runId ||
      canvas.lapSystemDir.split("/").pop()?.replace(/^app_/, "") ||
      canvas.lapSystemDir.split("\\").pop()?.replace(/^app_/, "") ||
      "default"
    );
  }, [canvas.lapSystemDir, canvas.runId]);

  useEffect(() => {
    if (canvas.screenPngs.length === 0) return;
    setLastScreens(canvas.screenPngs);
    setLastRunId(liveRunId);
  }, [canvas.screenPngs, liveRunId]);

  const displayScreens = canvas.screenPngs.length > 0 ? canvas.screenPngs : lastScreens;
  const currentRunId = canvas.screenPngs.length > 0 ? liveRunId : lastRunId || liveRunId;

  const selectedScreen = displayScreens[selectedScreenIndex] ?? "";
  const screenAssetUrl = useCallback(
    (png: string) => {
      const run = encodeURIComponent(currentRunId);
      const file = encodeURIComponent(png);
      const publicPath = `/v1/runs/${run}/files/screens/${file}`;
      const activeMode = typeof window === "undefined" ? backendMode : getBackendMode();
      if (activeMode === "mock" || currentRunId.startsWith("mock-")) return publicPath;
      return `${SAAS_URL}${publicPath}`;
    },
    [backendMode, currentRunId],
  );
  const selectedScreenUrl = useMemo(() => {
    if (!selectedScreen) return "";
    return screenAssetUrl(selectedScreen);
  }, [screenAssetUrl, selectedScreen]);

  const fallbackScreenUrl = useCallback(
    (png: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8f9fa"/>
      <stop offset="1" stop-color="#eceff3"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" rx="24" fill="url(#bg)"/>
  <rect x="28" y="28" width="424" height="424" rx="20" fill="none" stroke="#ff5a13" stroke-width="2"/>
  <text x="240" y="214" fill="#ff5a13" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">Preview</text>
  <text x="240" y="258" fill="#6b7280" font-family="monospace" font-size="18" text-anchor="middle">${png}</text>
  <text x="240" y="292" fill="#9ca3af" font-family="monospace" font-size="13" text-anchor="middle">${currentRunId}</text>
</svg>`;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    },
    [currentRunId],
  );
  const selectedPreviewUrl = useMemo(() => {
    if (!selectedScreenUrl || !selectedScreen) return "";
    return failedScreenUrls[selectedScreenUrl] ? fallbackScreenUrl(selectedScreen) : selectedScreenUrl;
  }, [failedScreenUrls, fallbackScreenUrl, selectedScreen, selectedScreenUrl]);

  useEffect(() => {
    setBackendModeState(getBackendMode());
  }, []);

  useEffect(() => {
    if (displayScreens.length === 0) {
      setSelectedScreenIndex(0);
      setScreenPreviewOpen(false);
      return;
    }
    setSelectedScreenIndex((current) => Math.min(current, displayScreens.length - 1));
  }, [displayScreens.length]);

  useEffect(() => {
    if (!screenPreviewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setScreenPreviewOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [screenPreviewOpen]);

  useEffect(() => {
    const openSelectedScreen = () => {
      if (selectedScreen) setScreenPreviewOpen(true);
    };
    window.addEventListener("redesign-preview-selected-screen", openSelectedScreen);
    return () => window.removeEventListener("redesign-preview-selected-screen", openSelectedScreen);
  }, [selectedScreen]);

  useEffect(() => {
    const openHardwareSettings = () => setHardwareOpen(true);
    window.addEventListener("redesign-open-hardware-settings", openHardwareSettings);
    return () => window.removeEventListener("redesign-open-hardware-settings", openHardwareSettings);
  }, []);

  const openDocumentPanel = useCallback(() => {
    setRightOpen(false);
    setDocumentOpen((value) => !value);
  }, []);

  const openArtifactPanel = useCallback(() => {
    setDocumentOpen(false);
    setRightInstant(true);
    setRightOpen((value) => !value);
  }, []);

  const enterProjectMode = useCallback(() => {
    setEnteredProject(true);
    setRightOpen(false);
    setDocumentOpen(true);
  }, []);

  const shellStyle = {
    "--upload-label": JSON.stringify(s.uploadAttachmentLabel),
  } as CSSProperties;

  return (
    <main
      data-theme={theme}
      data-mode={projectMode ? "project" : "initial"}
      className="redesign-shell relative h-dvh overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
      style={shellStyle}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-[900ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
          projectMode ? "z-0 opacity-100" : "pointer-events-none z-0 opacity-0"
        }`}
      >
        <InfiniteCanvas>
          {displayScreens.length > 0 ? (
            displayScreens.map((png, index) => {
              const initialX = -340 + (index % 3) * 340;
              const initialY = -220 + Math.floor(index / 3) * 260;
              const isSelected = index === selectedScreenIndex;
              const imgUrl = screenAssetUrl(png);
              const imgSrc = failedScreenUrls[imgUrl] ? fallbackScreenUrl(png) : imgUrl;
              return (
                <CanvasItem key={png} initialX={initialX} initialY={initialY} onSelect={() => setSelectedScreenIndex(index)}>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedScreenIndex(index);
                      }
                    }}
                    className={`group relative w-[300px] cursor-grab select-none rounded-[18px] outline-none transition-all active:cursor-grabbing ${
                      isSelected
                        ? "shadow-[0_22px_60px_rgba(255,90,19,0.24),0_8px_28px_rgba(15,23,42,0.16)]"
                        : "shadow-[0_14px_34px_rgba(15,23,42,0.12)] hover:shadow-[0_18px_42px_rgba(15,23,42,0.16)]"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={png}
                      width={480}
                      height={480}
                      draggable={false}
                      onError={() => setFailedScreenUrls((current) => ({ ...current, [imgUrl]: true }))}
                      className="block h-auto w-full rounded-[18px] object-contain"
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-[18px] transition-all ${
                        isSelected
                          ? "ring-2 ring-[color-mix(in_srgb,var(--primary)_64%,white)] shadow-[0_0_22px_rgba(255,90,19,0.34)_inset]"
                          : "ring-1 ring-black/5 group-hover:ring-[var(--border)]"
                      }`}
                    />
                  </div>
                </CanvasItem>
              );
            })
          ) : (
            <CanvasItem initialX={-180} initialY={-120}>
              <div className="flex h-64 w-[420px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/70 text-center text-sm text-[var(--muted-foreground)] shadow-2xl backdrop-blur-xl">
                Screens 出现后会浮到这里
              </div>
            </CanvasItem>
          )}
        </InfiniteCanvas>
      </div>

      <section
        className={`absolute z-30 overflow-hidden ${
          projectMode
            ? "rounded-[20px] border border-[var(--border)] bg-[var(--card)]/76 shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur-2xl"
            : "border border-transparent bg-transparent"
        }`}
        style={{
          top: projectMode ? 88 : 0,
          left: projectMode ? 32 : 0,
          bottom: projectMode ? 56 : 0,
          right: projectMode ? "calc(100vw - 32px - 26vw)" : 0,
          transition: [
            "top 0.9s cubic-bezier(0.22,1,0.36,1)",
            "left 0.9s cubic-bezier(0.22,1,0.36,1)",
            "bottom 0.9s cubic-bezier(0.22,1,0.36,1)",
            "right 0.9s cubic-bezier(0.22,1,0.36,1)",
            "border-radius 0.6s ease",
            "background-color 0.6s ease",
          ].join(","),
        }}
      >
        <div className="h-full w-full">{threadSlot}</div>
      </section>

      <button
        type="button"
        onClick={() => setLeftOpen(true)}
        title={s.projectsLabel}
        aria-label={s.projectsLabel}
        className={`fixed left-6 z-[45] flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-[var(--foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-500 hover:bg-[var(--card)] ${
          projectMode ? "bottom-4 size-8" : "top-6 size-12"
        } ${leftOpen ? "pointer-events-none scale-95 opacity-0" : "opacity-100"}`}
      >
        <PanelLeftOpen className={projectMode ? "size-4" : "size-5"} />
      </button>

      <button
        type="button"
        onClick={enterProjectMode}
        title="进入操作界面"
        aria-label="进入操作界面"
        className={`fixed right-6 top-6 z-[70] flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 hover:bg-[var(--card)] ${
          projectMode ? "pointer-events-none scale-95 opacity-0" : "opacity-100"
        }`}
      >
        <PanelRightOpen className="size-4" />
        操作界面
      </button>

      <button
        type="button"
        onClick={() => {
          setEnteredProject(false);
          setRightOpen(false);
          setDocumentOpen(false);
          setScreenPreviewOpen(false);
        }}
        title="返回主界面"
        aria-label="返回主界面"
        className={`fixed left-6 top-6 z-[80] flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-[var(--foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 hover:bg-[var(--card)] ${
          projectMode ? "opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ArrowLeft className="size-5" />
      </button>

      <button
        type="button"
        onClick={openDocumentPanel}
        title="需求文档"
        aria-label="需求文档"
        className={`fixed right-6 top-6 z-[70] flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-[var(--muted-foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-[var(--card)] hover:text-[var(--foreground)] ${
          projectMode ? "opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {documentOpen ? <PanelRightClose className="size-4" /> : <FileText className="size-4" />}
      </button>

      <button
        type="button"
        onClick={openArtifactPanel}
        title={s.previewCanvas}
        aria-label={s.previewCanvas}
        className={`fixed bottom-6 right-6 z-[70] flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-[var(--muted-foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-[var(--card)] hover:text-[var(--foreground)] ${
          projectMode ? "opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {rightOpen ? <PanelRightClose className="size-4" /> : <Menu className="size-4 stroke-[3]" />}
      </button>

      <button
        type="button"
        aria-label={s.cancel}
        onClick={() => setLeftOpen(false)}
        className={`fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] transition-opacity duration-200 ${
          leftOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed bottom-4 left-4 top-4 z-[60] flex w-[300px] max-w-[calc(100vw-32px)] flex-col gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--card)]/80 p-3 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          leftOpen ? "translate-x-0" : "pointer-events-none -translate-x-[calc(100%_+_1.5rem)]"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 border-b border-[var(--border)] px-1 pb-3">
          <img src="/os.jpg" alt="OmniStack UI logo" className="size-5 flex-shrink-0 rounded-md object-cover" />
          <span className="text-sm font-semibold tracking-wide">{s.appName}</span>
          <button
            type="button"
            onClick={() => setLeftOpen(false)}
            title={s.cancel}
            aria-label={s.cancel}
            className="ml-auto flex size-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>
        {projectSlot}
        {threadListSlot}
      </aside>

      <section
        data-slot="artifact-panel"
        className={`fixed bottom-4 right-4 top-4 z-40 min-w-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]/80 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl ${
          projectMode ? "w-[12rem]" : "w-[80vw]"
        } ${rightOpen ? "" : "pointer-events-none"}`}
        style={{
          transform: rightOpen ? "translateX(0)" : "translateX(110%)",
          transition: rightInstant
            ? "transform 0.55s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="h-full w-full">
          {artifactSlot}
        </div>
      </section>

      <style jsx global>{`
        .redesign-shell {
          --background: #f4f5f6;
          --foreground: #090909;
          --card: #ffffff;
          --card-foreground: #090909;
          --popover: #ffffff;
          --popover-foreground: #090909;
          --primary: #ff5a13;
          --primary-foreground: #ffffff;
          --secondary: #ffffff;
          --secondary-foreground: #090909;
          --muted: #f0f1f2;
          --muted-foreground: #8b8b8b;
          --accent: #f1f2f3;
          --accent-foreground: #171717;
          --border: rgba(15, 23, 42, 0.08);
          --input: rgba(15, 23, 42, 0.08);
          --ring: #ff5a13;
          --thread-bg: radial-gradient(ellipse 58% 34% at 50% 100%, rgba(255, 104, 26, 0.08) 0%, transparent 62%),
            linear-gradient(180deg, #f8f9fa 0%, #f4f5f6 48%, #eef0f2 100%);
          --thread-footer: linear-gradient(to bottom, transparent 0%, #f4f5f6 42%);
          --welcome-title: #050505;
          --welcome-subtitle: #8b8b8b;
          --composer-bg: rgba(255, 255, 255, 0.9);
          --composer-input: #1f1f1f;
          --composer-placeholder: #b5b5b5;
          --attachment-bg: #ffffff;
          --attachment-fg: #757575;
          color-scheme: light;
        }

        .redesign-shell[data-theme="dark"] {
          --background: #0d0e10;
          --foreground: #f4f5f6;
          --card: #17191c;
          --card-foreground: #f4f5f6;
          --popover: #17191c;
          --popover-foreground: #f4f5f6;
          --primary: #ff5a13;
          --primary-foreground: #ffffff;
          --secondary: #1d2024;
          --secondary-foreground: #f4f5f6;
          --muted: #1d2024;
          --muted-foreground: #8b8f96;
          --accent: #22262b;
          --accent-foreground: #f4f5f6;
          --border: rgba(255, 255, 255, 0.1);
          --input: rgba(255, 255, 255, 0.1);
          --ring: #ff5a13;
          --thread-bg: radial-gradient(ellipse 58% 34% at 50% 100%, rgba(255, 104, 26, 0.1) 0%, transparent 62%),
            linear-gradient(180deg, #131517 0%, #0d0e10 48%, #08090a 100%);
          --thread-footer: linear-gradient(to bottom, transparent 0%, #0d0e10 42%);
          --welcome-title: #fafafa;
          --welcome-subtitle: #9aa0a8;
          --composer-bg: rgba(29, 32, 36, 0.9);
          --composer-input: #f0f1f2;
          --composer-placeholder: #6b7077;
          --attachment-bg: #1d2024;
          --attachment-fg: #b5b9bf;
          color-scheme: dark;
        }

        .redesign-shell {
          overscroll-behavior: none;
        }

        .redesign-shell [data-slot="aui_thread-viewport"] {
          overscroll-behavior: contain;
        }

        .redesign-canvas-grid {
          background-color: var(--background);
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 28px 28px;
          background-position: -1px -1px;
        }

        .redesign-shell .aui-thread-root {
          background: var(--thread-bg) !important;
        }

        .redesign-shell .aui-thread-viewport-footer {
          background: var(--thread-footer) !important;
        }

        .redesign-shell .aui-thread-welcome-message {
          align-items: center;
          text-align: center;
          padding-top: 8vh;
        }

        .redesign-shell .aui-thread-welcome-message h1 {
          max-width: min(900px, 92vw);
          background: none !important;
          color: var(--welcome-title) !important;
          -webkit-text-fill-color: var(--welcome-title);
          font-size: clamp(48px, 5.2vw, 92px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: 0;
        }

        .redesign-shell .aui-thread-welcome-message p {
          margin-top: 18px;
          color: var(--welcome-subtitle) !important;
          font-size: clamp(16px, 1.4vw, 22px);
          line-height: 1.5;
          font-weight: 500;
        }

        .redesign-shell .aui-thread-welcome-suggestions {
          display: none;
        }

        .redesign-shell [data-slot="aui_composer-dock"] {
          max-width: min(1040px, 82vw) !important;
          padding-bottom: 9vh;
        }

        .redesign-shell[data-mode="project"] [data-slot="aui_composer-dock"] {
          padding-bottom: 16px;
        }

        .redesign-shell [data-slot="aui_composer-shell"] {
          border: 1px solid var(--border) !important;
          border-radius: 26px !important;
          background: var(--composer-bg) !important;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.1), 0 6px 18px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(18px);
          padding: 10px 12px !important;
        }

        .redesign-shell .aui-composer-input {
          min-height: 28px !important;
          color: var(--composer-input) !important;
          font-size: 16px !important;
          padding-left: 6px !important;
        }

        .redesign-shell .aui-composer-input::placeholder {
          color: var(--composer-placeholder) !important;
        }

        .redesign-shell .aui-composer-action-wrapper {
          align-items: center;
        }

        .redesign-shell .aui-composer-send {
          width: 40px !important;
          height: 40px !important;
          border-radius: 999px !important;
          background: var(--primary) !important;
          box-shadow: 0 8px 20px rgba(255, 90, 19, 0.28) !important;
          color: var(--primary-foreground) !important;
          transform: none !important;
        }

        .redesign-shell .aui-composer-send:hover {
          background: #ff6a2a !important;
        }

        .redesign-shell .aui-composer-add-attachment {
          width: 40px !important;
          height: 40px !important;
          border-radius: 999px !important;
          border: 1px solid var(--border) !important;
          background: transparent !important;
          color: var(--attachment-fg) !important;
          padding: 0 !important;
        }

        .redesign-shell .aui-composer-add-attachment::after {
          content: none;
        }

        .redesign-shell .aui-attachment-add-icon {
          width: 18px;
          height: 18px;
        }

        .redesign-shell[data-mode="initial"] .aui-thread-welcome-message h1,
        .redesign-shell[data-mode="initial"] .aui-thread-welcome-message p {
          opacity: 1;
          transition: opacity 0.7s ease;
          pointer-events: auto;
        }

        .redesign-shell[data-mode="project"] .aui-thread-welcome-message h1,
        .redesign-shell[data-mode="project"] .aui-thread-welcome-message p {
          opacity: 0;
          transition: opacity 0.7s ease;
          pointer-events: none;
        }

        .redesign-shell .aui-composer-attachments,
        .redesign-shell [data-slot="aui_composer-attachments"] {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
        }

        .redesign-shell .aui-attachment-tile {
          height: 60px !important;
          width: auto !important;
          min-width: 0 !important;
          border-radius: 12px !important;
          overflow: hidden;
          flex: 0 0 auto;
          background: transparent !important;
          border: none !important;
        }

        .redesign-shell .aui-attachment-tile-avatar {
          height: 60px !important;
          width: auto !important;
          border-radius: 12px !important;
          background: transparent !important;
        }

        .redesign-shell .aui-attachment-tile-image {
          height: 60px !important;
          width: auto !important;
          object-fit: contain !important;
        }

        .redesign-shell [data-slot="aui_message-group"] {
          color: var(--foreground);
        }

        .redesign-shell .bg-zinc-900,
        html[data-redesign-theme="light"] .bg-zinc-900,
        html[data-redesign-theme="dark"] .bg-zinc-900 {
          color: var(--foreground) !important;
          border-color: var(--border) !important;
          backdrop-filter: blur(24px);
        }

        .redesign-shell .bg-black\\/70,
        html[data-redesign-theme="light"] .bg-black\\/70,
        html[data-redesign-theme="dark"] .bg-black\\/70 {
          backdrop-filter: blur(4px);
        }

        .redesign-shell .text-zinc-300,
        .redesign-shell .text-zinc-400,
        .redesign-shell .text-zinc-500,
        .redesign-shell .text-zinc-600 {
          color: var(--muted-foreground) !important;
        }

        .redesign-shell .border-white\\/10,
        .redesign-shell .border-white\\/8 {
          border-color: var(--border) !important;
        }

        .redesign-shell .bg-white\\/5 {
          background-color: color-mix(in srgb, var(--muted) 82%, transparent) !important;
        }

        .redesign-shell .hover\\:bg-white\\/5:hover,
        .redesign-shell .hover\\:bg-white\\/8:hover {
          background-color: var(--muted) !important;
        }

        .redesign-shell input.bg-white\\/5 {
          color: var(--foreground) !important;
          caret-color: var(--primary);
        }

        .redesign-shell input.bg-white\\/5::placeholder {
          color: var(--muted-foreground) !important;
        }

        html[data-redesign-theme="light"] input.bg-white\\/5 {
          color: #090909 !important;
          caret-color: #ff5a13;
        }

        html[data-redesign-theme="light"] input.bg-white\\/5::placeholder {
          color: #9a9a9a !important;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[120] flex items-center justify-center bg-black transition-opacity duration-200 ${
          screenPreviewOpen && selectedPreviewUrl
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!screenPreviewOpen}
      >
        {selectedPreviewUrl ? (
          <img
            src={selectedPreviewUrl}
            alt={selectedScreen}
            draggable={false}
            onError={() => {
              if (selectedScreenUrl) {
                setFailedScreenUrls((current) => ({ ...current, [selectedScreenUrl]: true }));
              }
            }}
            className="h-screen w-screen select-none object-contain"
          />
        ) : null}
      </div>

      <div
        className={`fixed bottom-2 left-2 z-[55] transition-opacity duration-300 ${
          projectMode ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative size-12">
          <SettingsDock
            languageSlot={languageSlot}
            onOpenManual={() => setManualOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      </div>

      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/20 px-6 backdrop-blur-[2px] transition-opacity duration-200 ${
          hardwareOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!hardwareOpen}
      >
        <button
          type="button"
          aria-label={s.cancel}
          onClick={() => setHardwareOpen(false)}
          className="absolute inset-0 cursor-default"
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-label="硬件设置"
          className={`relative max-h-[84vh] w-full max-w-[560px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[0_30px_100px_rgba(15,23,42,0.16)] transition-all duration-300 ${
            hardwareOpen ? "translate-y-0 scale-100" : "-translate-y-6 scale-[0.98]"
          }`}
        >
          <button
            type="button"
            onClick={() => setHardwareOpen(false)}
            aria-label={s.cancel}
            className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <X className="size-5" />
          </button>
          <h2 className="mb-4 text-2xl font-black text-[var(--foreground)]">硬件设置</h2>
          <div className="max-h-[calc(84vh-96px)] overflow-y-auto pr-1">{hardwareSlot}</div>
        </section>
      </div>

      <ProjectDocumentPanel open={documentOpen} onOpenChange={setDocumentOpen} projectMode={projectMode} />
    </main>
  );
}
