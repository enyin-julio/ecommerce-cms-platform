import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AIH 品牌商城",
    template: "%s | AIH 品牌商城"
  },
  description: "AIH 品牌商城提供品牌內容、商品型錄與電商購物體驗。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
