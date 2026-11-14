import type { Metadata } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "起初的心 · 四周圣诞旅程",
  description: "四个星期，四次停下来。一起回到爱开始的地方。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body className="antialiased"><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
