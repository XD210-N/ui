"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Languages, Settings } from "lucide-react";
import { useStrings } from "@/lib/strings-context";

type SettingsDockProps = {
  languageSlot: ReactNode;
  onOpenManual: () => void;
};

export function SettingsDock({ languageSlot, onOpenManual }: SettingsDockProps) {
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
        className={`absolute bottom-16 left-0 flex flex-col gap-3 rounded-full border border-black/5 bg-white/85 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setLanguageOpen((value) => !value)}
          aria-label={s.languageSettings}
          title={s.languageSettings}
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            languageOpen
              ? "bg-[#fff1ea] text-[#ff5a13]"
              : "bg-[#f4f5f6] text-[#202020] hover:bg-[#eceeef]"
          }`}
        >
          <Languages className="size-5" />
        </button>
        <button
          type="button"
          onClick={handleManualClick}
          aria-label={s.toolManual}
          title={s.toolManual}
          className="flex size-12 items-center justify-center rounded-full bg-[#f4f5f6] text-[#202020] transition-colors hover:bg-[#eceeef]"
        >
          <BookOpen className="size-5" />
        </button>

        <div
          className={`absolute bottom-0 left-[calc(100%+12px)] min-w-64 rounded-full border border-black/5 bg-white/90 px-3 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200 ${
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
        className={`flex size-12 items-center justify-center rounded-full border border-black/5 bg-white/90 text-[#202020] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-white ${
          open ? "rotate-45" : "rotate-0"
        }`}
      >
        <Settings className="size-5" />
      </button>
    </div>
  );
}
