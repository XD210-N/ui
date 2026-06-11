"use client";

import { localeOptions } from "../content";
import type { DisplayLocale, HomeCopy } from "../types";

interface SettingsPanelProps {
  content: HomeCopy;
  locale: DisplayLocale;
  setLocale: (locale: DisplayLocale) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  languageOpen: boolean;
  setLanguageOpen: (open: boolean) => void;
  openGuide: () => void;
  muted: boolean;
}

export function SettingsPanel({
  content,
  locale,
  setLocale,
  settingsOpen,
  setSettingsOpen,
  languageOpen,
  setLanguageOpen,
  openGuide,
  muted,
}: SettingsPanelProps) {
  return (
    <div
      className={[
        "fixed bottom-7 left-7 z-[180] isolate transition-[filter] duration-300",
        muted ? "pointer-events-none blur-[7px]" : "",
      ].join(" ")}
      data-redesign-settings-root
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="absolute bottom-14 left-0 flex origin-bottom-left flex-col gap-2.5"
        style={{
          opacity: settingsOpen ? 1 : 0,
          pointerEvents: settingsOpen ? "auto" : "none",
          transform: settingsOpen ? "translateY(0) scale(1)" : "translateY(18px) scale(0.94)",
          transition: "opacity 0.24s ease, transform 0.34s cubic-bezier(0.22, 1.18, 0.36, 1)",
        }}
      >
        <div
          className="group relative flex min-h-11 w-[170px] cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full border border-black/6 bg-white/84 px-[15px] text-sm font-semibold text-black/90 shadow-[0_14px_30px_rgba(15,18,24,0.05),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-[18px] transition-[background,box-shadow,transform] duration-200 hover:translate-x-1 hover:bg-white/98 hover:shadow-[0_18px_34px_rgba(15,18,24,0.08),inset_0_1px_0_rgba(255,255,255,0.94)]"
          onMouseEnter={() => setLanguageOpen(true)}
          onClick={(event) => { event.stopPropagation(); setLanguageOpen(true); }}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#f4f5f6]/95 text-[13px]">A</span>
          <span>{content.language}</span>
          <div
            className="absolute left-[calc(100%+10px)] top-1/2 flex origin-left items-center gap-2 rounded-full border border-black/6 bg-white/92 p-[7px] shadow-[0_18px_38px_rgba(15,18,24,0.08)] backdrop-blur-[18px]"
            style={{
              opacity: languageOpen ? 1 : 0,
              pointerEvents: languageOpen ? "auto" : "none",
              transform: languageOpen ? "translate(0, -50%) scaleX(1)" : "translate(-16px, -50%) scaleX(0.72)",
              transition: "opacity 0.2s ease, transform 0.28s cubic-bezier(0.18, 1.26, 0.42, 1)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {localeOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLocale(item.id)}
                className={[
                  "grid size-8 place-items-center rounded-full text-[13px] font-bold transition-[background,color,transform] duration-200 hover:scale-110 hover:bg-[#ff5a0a]/14 hover:text-[#ff5a0a]",
                  locale === item.id ? "scale-110 bg-[#ff5a0a]/14 text-[#ff5a0a]" : "bg-[#f4f5f6]/95 text-black/70",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); openGuide(); }}
          className="flex min-h-11 w-[170px] cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full border border-black/6 bg-white/84 px-[15px] text-sm font-semibold text-black/90 shadow-[0_14px_30px_rgba(15,18,24,0.05),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-[18px] transition-[background,box-shadow,transform] duration-200 hover:translate-x-1 hover:bg-white/98 hover:shadow-[0_18px_34px_rgba(15,18,24,0.08),inset_0_1px_0_rgba(255,255,255,0.94)]"
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#f4f5f6]/95 text-[13px]">?</span>
          <span>{content.guide}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setSettingsOpen((open) => {
            if (open) setLanguageOpen(false);
            return !open;
          });
        }}
        className="grid size-[42px] place-items-center rounded-full bg-white/84 text-xl text-black shadow-[0_16px_36px_rgba(15,18,24,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-[18px] transition-[background,transform] duration-300 hover:rotate-[18deg] hover:scale-105 hover:bg-white/98"
        aria-label={content.settings}
        title={content.settings}
      >
        ⚿
      </button>
    </div>
  );
}
