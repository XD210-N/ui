"use client";

import { useLocale, useSetLocale } from "@/lib/strings-context";
import type { Locale } from "@/lib/strings";

export function RedesignLanguageToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const options: Array<{ locale: Locale; label: string }> = [
    { locale: "zh-TW", label: "繁" },
    { locale: "zh", label: "中" },
    { locale: "en", label: "EN" },
    { locale: "ja", label: "日" },
    { locale: "ko", label: "한" },
  ];

  return (
    <div className="flex items-center gap-2">
      {options.map((item) => (
        <button
          key={item.locale}
          onClick={() => setLocale(item.locale)}
          className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors ${
            locale === item.locale
              ? "bg-[#fff1ea] text-[#ff5a13]"
              : "bg-[#f4f5f6] text-[#202020] hover:bg-[#eceeef]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
