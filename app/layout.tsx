import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StringsProvider } from "@/lib/strings-context";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OmniStack UI",
  description: "OmniStack embedded UI generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans" className={`h-dvh ${inter.variable}`}>
      <body className="h-dvh antialiased">
        <StringsProvider>{children}</StringsProvider>
      </body>
    </html>
  );
}
