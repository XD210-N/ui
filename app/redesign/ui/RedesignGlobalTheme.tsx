"use client";

import { useEffect } from "react";

export function RedesignGlobalTheme() {
  useEffect(() => {
    const saved = localStorage.getItem("omnistack-redesign-theme");
    document.documentElement.dataset.redesignTheme = saved === "dark" ? "dark" : "light";
  }, []);

  return (
    <style jsx global>{`
      html[data-redesign-theme="light"] {
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
        color-scheme: light;
      }

      html[data-redesign-theme="dark"] {
        --background: #0d0e10;
        --foreground: #f4f5f6;
        --card: #17191c;
        --card-foreground: #f4f5f6;
        --popover: #17191c;
        --popover-foreground: #f4f5f6;
        --primary: #ff5a13;
        --primary-foreground: #ffffff;
        --secondary: #1f2227;
        --secondary-foreground: #f4f5f6;
        --muted: #24272d;
        --muted-foreground: #a5a7ad;
        --accent: #2b2f36;
        --accent-foreground: #f4f5f6;
        --border: rgba(255, 255, 255, 0.1);
        --input: rgba(255, 255, 255, 0.12);
        --ring: #ff7a3d;
        color-scheme: dark;
      }

      html[data-redesign-theme="light"] .bg-zinc-900 {
        background-color: rgba(255, 255, 255, 0.94) !important;
        color: #090909 !important;
        border-color: rgba(15, 23, 42, 0.08) !important;
        backdrop-filter: blur(24px);
      }

      html[data-redesign-theme="light"] .bg-black\\/70 {
        background-color: rgba(244, 245, 246, 0.46) !important;
        backdrop-filter: blur(4px);
      }

      html[data-redesign-theme="light"] .text-zinc-300,
      html[data-redesign-theme="light"] .text-zinc-400,
      html[data-redesign-theme="light"] .text-zinc-500,
      html[data-redesign-theme="light"] .text-zinc-600 {
        color: #8b8b8b !important;
      }

      html[data-redesign-theme="light"] .border-white\\/10,
      html[data-redesign-theme="light"] .border-white\\/8 {
        border-color: rgba(15, 23, 42, 0.08) !important;
      }

      html[data-redesign-theme="light"] .bg-white\\/5 {
        background-color: rgba(240, 241, 242, 0.82) !important;
      }

      html[data-redesign-theme="light"] .hover\\:bg-white\\/5:hover,
      html[data-redesign-theme="light"] .hover\\:bg-white\\/8:hover {
        background-color: #f0f1f2 !important;
      }

      html[data-redesign-theme="light"] input.bg-white\\/5 {
        color: #090909 !important;
        caret-color: #ff5a13;
      }

      html[data-redesign-theme="light"] input.bg-white\\/5::placeholder {
        color: #9a9a9a !important;
      }

      html[data-redesign-theme="dark"] .bg-zinc-900 {
        background-color: rgba(23, 25, 28, 0.94) !important;
        color: #f4f5f6 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
    `}</style>
  );
}
