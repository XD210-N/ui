"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useStrings } from "@/lib/strings-context";

type ManualModalProps = {
  open: boolean;
  onClose: () => void;
  videoSrc?: string;
};

export function ManualModal({ open, onClose, videoSrc }: ManualModalProps) {
  const s = useStrings();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/10 px-6 backdrop-blur-[2px] transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label={s.closeManual}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={s.toolManual}
        className={`relative max-h-[84vh] w-full max-w-[920px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-all duration-300 ${
          open ? "translate-y-0 scale-100" : "-translate-y-8 scale-[0.98]"
        }`}
      >
        <div className="mx-auto mt-5 h-1.5 w-16 rounded-full bg-[#ffd7c4]" />
        <button
          type="button"
          onClick={onClose}
          aria-label={s.closeManual}
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:text-[var(--foreground)]"
        >
          <X className="size-5" />
        </button>

        <div className="max-h-[calc(84vh-24px)] overflow-y-auto px-10 pb-10 pt-7">
          <div className="mb-8">
            <h2 className="text-4xl font-black tracking-[0] text-[var(--foreground)]">
              {s.manualTitle}
            </h2>
            <p className="mt-3 text-sm font-medium text-[var(--muted-foreground)]">
              {s.manualEscHint}
            </p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--muted)] shadow-inner">
            {videoSrc ? (
              <video
                controls
                preload="metadata"
                className="aspect-video w-full bg-black"
                src={videoSrc}
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--card)] via-[var(--muted)] to-[#fff1ea] px-8 text-center">
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {s.manualVideoPendingTitle}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {s.manualVideoPendingDesc}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-7 text-[var(--muted-foreground)]">
            <section>
              <h3 className="text-2xl font-black text-[var(--foreground)]">{s.manualSectionOneTitle}</h3>
              <p className="mt-4 text-base leading-8">
                {s.manualSectionOneBody}
              </p>
            </section>
            <section>
              <h3 className="text-2xl font-black text-[var(--foreground)]">{s.manualSectionTwoTitle}</h3>
              <p className="mt-4 text-base leading-8">
                {s.manualSectionTwoBody}
              </p>
            </section>
            <section>
              <h3 className="text-2xl font-black text-[var(--foreground)]">{s.manualSectionThreeTitle}</h3>
              <p className="mt-4 text-base leading-8">
                {s.manualSectionThreeBody}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
