"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Menu,
  PanelLeftOpen,
  PanelRightClose,
  X,
} from "lucide-react";
import { useStrings } from "@/lib/strings-context";
import { ManualModal } from "./ManualModal";
import { SettingsDock } from "./SettingsDock";

type RedesignAppShellProps = {
  projectSlot: ReactNode;
  threadListSlot: ReactNode;
  languageSlot: ReactNode;
  threadSlot: ReactNode;
  artifactSlot: ReactNode;
};

export function RedesignAppShell({
  projectSlot,
  threadListSlot,
  languageSlot,
  threadSlot,
  artifactSlot,
}: RedesignAppShellProps) {
  const s = useStrings();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const shellStyle = {
    "--upload-label": JSON.stringify(s.uploadAttachmentLabel),
  } as CSSProperties;

  return (
    <main
      className="redesign-shell relative h-dvh overflow-hidden bg-[#f4f5f6] text-[#090909]"
      style={shellStyle}
    >
      <section
        className={`relative h-full min-h-0 min-w-0 overflow-hidden transition-[width] duration-300 ease-out ${
          rightOpen ? "w-[16.666vw]" : "w-full"
        }`}
      >
        {threadSlot}
      </section>

      <button
        type="button"
        onClick={() => setLeftOpen(true)}
        title={s.projectsLabel}
        aria-label={s.projectsLabel}
        className={`fixed bottom-6 left-6 z-30 flex size-12 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#252525] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-white ${
          leftOpen ? "pointer-events-none scale-95 opacity-0" : "opacity-100"
        }`}
      >
        <PanelLeftOpen className="size-5" />
      </button>

      <button
        type="button"
        onClick={() => setRightOpen((value) => !value)}
        title={s.previewCanvas}
        aria-label={s.previewCanvas}
        className="fixed right-6 top-6 z-[70] flex size-12 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#8a8a8a] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-colors hover:bg-white hover:text-[#4f4f4f]"
      >
        {rightOpen ? (
          <PanelRightClose className="size-5" />
        ) : (
          <Menu className="size-7 stroke-[3]" />
        )}
      </button>

      <button
        type="button"
        aria-label={s.cancel}
        onClick={() => setLeftOpen(false)}
        className={`fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] transition-opacity duration-200 ${
          leftOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[280px] max-w-[calc(100vw-32px)] flex-col gap-2 border-r border-black/8 bg-white/95 p-3 shadow-2xl shadow-black/10 backdrop-blur-xl transition-transform duration-300 ease-out ${
          leftOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 border-b border-black/8 px-1 pb-3">
          <img
            src="/os.jpg"
            alt="OmniStack UI logo"
            className="size-5 flex-shrink-0 rounded-md object-cover"
          />
          <span className="text-sm font-semibold tracking-wide">
            {s.appName}
          </span>
          <button
            type="button"
            onClick={() => setLeftOpen(false)}
            title={s.cancel}
            aria-label={s.cancel}
            className="ml-auto flex size-7 items-center justify-center rounded-full text-[#8a8a8a] transition-colors hover:bg-black/5 hover:text-[#222]"
          >
            <X className="size-4" />
          </button>
        </div>
        {projectSlot}
        {threadListSlot}
        <SettingsDock
          languageSlot={languageSlot}
          onOpenManual={() => setManualOpen(true)}
        />
      </aside>

      <section
        className={`fixed inset-y-0 right-0 z-40 h-full w-[83.333vw] min-w-0 overflow-hidden border-l border-black/8 bg-white shadow-2xl shadow-black/15 transition-transform duration-300 ease-out ${
          rightOpen
            ? "translate-x-0"
            : "pointer-events-none translate-x-full"
        }`}
      >
        {artifactSlot}
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
          --muted-foreground: #9a9a9a;
          --accent: #f1f2f3;
          --accent-foreground: #171717;
          --border: rgba(15, 23, 42, 0.08);
          --input: rgba(15, 23, 42, 0.08);
          --ring: #ff5a13;
          color-scheme: light;
        }

        .redesign-shell .aui-thread-root {
          background:
            radial-gradient(ellipse 58% 34% at 50% 100%, rgba(255, 104, 26, 0.08) 0%, transparent 62%),
            linear-gradient(180deg, #f8f9fa 0%, #f4f5f6 48%, #eef0f2 100%) !important;
        }

        .redesign-shell .aui-thread-viewport-footer {
          background: linear-gradient(to bottom, transparent 0%, #f4f5f6 42%) !important;
        }

        .redesign-shell .aui-thread-welcome-message {
          align-items: center;
          text-align: center;
          padding-top: 8vh;
        }

        .redesign-shell .aui-thread-welcome-message h1 {
          max-width: min(900px, 92vw);
          background: none !important;
          color: #050505 !important;
          -webkit-text-fill-color: #050505;
          font-size: clamp(48px, 5.2vw, 92px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: 0;
        }

        .redesign-shell .aui-thread-welcome-message p {
          margin-top: 18px;
          color: #8b8b8b !important;
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

        .redesign-shell [data-slot="aui_composer-shell"] {
          min-height: 86px;
          border: 1px solid rgba(15, 23, 42, 0.04) !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12), 0 10px 28px rgba(255, 90, 19, 0.1);
          backdrop-filter: blur(18px);
          padding: 12px 16px 12px 28px !important;
        }

        .redesign-shell .aui-composer-input {
          min-height: 42px !important;
          color: #1f1f1f !important;
          font-size: 18px !important;
          padding-left: 4px !important;
        }

        .redesign-shell .aui-composer-input::placeholder {
          color: #b5b5b5 !important;
        }

        .redesign-shell .aui-composer-action-wrapper {
          align-items: center;
        }

        .redesign-shell .aui-composer-send {
          width: 56px !important;
          height: 56px !important;
          border-radius: 999px !important;
          background: #ff5a13 !important;
          box-shadow: 0 16px 38px rgba(255, 90, 19, 0.3) !important;
          color: #ffffff !important;
          transform: none !important;
        }

        .redesign-shell .aui-composer-send:hover {
          background: #ff6a2a !important;
        }

        .redesign-shell .aui-composer-add-attachment {
          min-width: 176px;
          width: auto !important;
          height: 56px !important;
          border-radius: 999px !important;
          border: 1px solid rgba(15, 23, 42, 0.06) !important;
          background: #ffffff !important;
          color: #757575 !important;
          padding-inline: 22px !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }

        .redesign-shell .aui-composer-add-attachment::after {
          content: var(--upload-label);
          margin-left: 8px;
          font-size: 16px;
          font-weight: 500;
          white-space: nowrap;
        }

        .redesign-shell .aui-attachment-add-icon {
          width: 18px;
          height: 18px;
        }

        .redesign-shell [data-slot="aui_message-group"] {
          color: #1f1f1f;
        }
      `}</style>
      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </main>
  );
}
