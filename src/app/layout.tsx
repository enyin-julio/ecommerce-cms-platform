import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ecommerce CMS Platform",
    template: "%s | Ecommerce CMS Platform"
  },
  description: "A modular monolith platform for brand sites, product catalogs, and ecommerce storefronts."
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
