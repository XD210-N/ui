"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Languages, Moon, Settings, Sun } from "lucide-react";
import { useStrings } from "@/lib/strings-context";
import type { RedesignTheme } from "./useRedesignTheme";

type SettingsDockProps = {
  languageSlot: ReactNode;
  onOpenManual: () => void;
  theme: RedesignTheme;
  onToggleTheme: () => void;
};

export function SettingsDock({
  languageSlot,
  onOpenManual,
  theme,
  onToggleTheme,
}: SettingsDockProps) {
  const s = useStrings();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleManualClick = () => {
    setLanguageOpen(false);
    setOpen(false);
    onOpenManual();
  };

  return (
    <div ref={rootRef} className="absolute bottom-4 left-4 z-10">
      <div
        className={`absolute bottom-14 left-0 flex flex-col gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/85 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={handleManualClick}
          aria-label={s.toolManual}
          title={s.toolManual}
          className="flex size-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
        >
          <BookOpen className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={s.themeSettings}
          title={theme === "light" ? s.darkTheme : s.lightTheme}
          className="flex size-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
        >
          {theme === "light" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setLanguageOpen((value) => !value)}
          aria-label={s.languageSettings}
          title={s.languageSettings}
          className={`flex size-10 items-center justify-center rounded-full transition-colors ${
            languageOpen
              ? "bg-[#fff1ea] text-[#ff5a13]"
              : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          <Languages className="size-4" />
        </button>

        <div
          className={`absolute bottom-1.5 left-[calc(100%_+_10px)] flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 px-1 py-1 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200 ${
            languageOpen
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-2 opacity-0"
          }`}
        >
          {languageSlot}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={s.settingsLabel}
        title={s.settingsLabel}
        className={`flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/90 text-[var(--foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-[var(--card)] ${
          open ? "rotate-45" : "rotate-0"
        }`}
      >
        <Settings className="size-4" />
      </button>
    </div>
  );
}
