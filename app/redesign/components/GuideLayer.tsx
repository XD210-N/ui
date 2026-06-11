"use client";

import type { HomeCopy } from "../types";

interface GuideLayerProps {
  open: boolean;
  closing: boolean;
  content: HomeCopy;
  onClose: () => void;
}

export function GuideLayer({ open, closing, content, onClose }: GuideLayerProps) {
  const active = open || closing;
  return (
    <div
      className={[
        "fixed inset-0 z-[200] flex items-start justify-center bg-[#f4f5f6]/40 pt-[58px] backdrop-blur-[14px] transition-opacity duration-300",
        active ? "opacity-100" : "pointer-events-none opacity-0",
        open ? "pointer-events-auto" : "",
      ].join(" ")}
      onClick={onClose}
    >
      <section
        className={[
          "h-[min(78vh,760px)] w-[min(780px,calc(100vw-70px))] origin-top overflow-y-auto rounded-[28px] border border-black/8 bg-white/82 shadow-[0_34px_90px_rgba(15,18,24,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[28px] transition-[opacity,transform]",
          open ? "translate-y-0 scale-y-100 opacity-100 duration-500 ease-[cubic-bezier(0.18,1.16,0.34,1)]" : "-translate-y-[70px] scale-y-[0.18] opacity-0 duration-[360ms] ease-[cubic-bezier(0.62,0,0.42,1)]",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 mx-auto mt-4 h-[5px] w-14 rounded-full bg-[#ff5a0a]/25" />
        <header className="px-[34px] pb-2.5 pt-5">
          <h2 className="m-0 text-[28px] font-semibold tracking-normal text-black">{content.guideTitle}</h2>
          <p className="mt-2 text-sm text-black/45">{content.guideSubtitle}</p>
        </header>
        <div className="px-[34px] pb-10 pt-2">
          {content.sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2.5 mt-[26px] text-lg font-semibold text-black">{section.title}</h3>
              <p className="m-0 text-[15px] leading-[1.9] text-black/70">
                <span>{section.body}</span>
                {section.links && section.links.length > 0 && (
                  <span>
                    {section.links.map((link) => (
                      <a
                        key={link}
                        href="javascript:void(0);"
                        className="ml-1 border-b border-[#ff5a0a]/25 text-[#ff5a0a] no-underline"
                      >
                        {link}。
                      </a>
                    ))}
                  </span>
                )}
              </p>
              {section.showDemo && (
                <div className="my-[18px] grid grid-cols-[1fr_0.7fr] grid-rows-[110px_110px] gap-3.5">
                  <div className="row-span-2 rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.16)),linear-gradient(135deg,#f7f7f7,#ffd8c3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
                  <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18)),linear-gradient(135deg,#ffffff,#ffe8dc)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
                  <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18)),linear-gradient(135deg,#f2f4f5,#ffe1d0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
