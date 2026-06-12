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
        className={`relative max-h-[84vh] w-full max-w-[920px] overflow-hidden rounded-[28px] border border-white/70 bg-white/78 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-all duration-300 ${
          open ? "translate-y-0 scale-100" : "-translate-y-8 scale-[0.98]"
        }`}
      >
        <div className="mx-auto mt-5 h-1.5 w-16 rounded-full bg-[#ffd7c4]" />
        <button
          type="button"
          onClick={onClose}
          aria-label={s.closeManual}
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/80 text-[#8a8a8a] shadow-sm transition-colors hover:text-[#222]"
        >
          <X className="size-5" />
        </button>

        <div className="max-h-[calc(84vh-24px)] overflow-y-auto px-10 pb-10 pt-7">
          <div className="mb-8">
            <h2 className="text-4xl font-black tracking-[0] text-[#090909]">
              {s.manualTitle}
            </h2>
            <p className="mt-3 text-sm font-medium text-[#9a9a9a]">
              {s.manualEscHint}
            </p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f6f7] shadow-inner">
            {videoSrc ? (
              <video
                controls
                preload="metadata"
                className="aspect-video w-full bg-black"
                src={videoSrc}
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-white via-[#f7f7f7] to-[#fff1ea] px-8 text-center">
                <p className="text-lg font-semibold text-[#202020]">
                  {s.manualVideoPendingTitle}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#8f8f8f]">
                  {s.manualVideoPendingDesc}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-7 text-[#656565]">
            <section>
              <h3 className="text-2xl font-black text-[#101010]">{s.manualSectionOneTitle}</h3>
              <p className="mt-4 text-base leading-8">
                {s.manualSectionOneBody}
              </p>
            </section>
            <section>
              <h3 className="text-2xl font-black text-[#101010]">{s.manualSectionTwoTitle}</h3>
              <p className="mt-4 text-base leading-8">
                {s.manualSectionTwoBody}
              </p>
            </section>
            <section>
              <h3 className="text-2xl font-black text-[#101010]">{s.manualSectionThreeTitle}</h3>
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
