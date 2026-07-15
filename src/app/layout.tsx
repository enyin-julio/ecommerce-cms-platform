import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSettingSafely();
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";
  const description =
    siteSetting?.seoDescription || "探索 UZEEK 品牌商城的精選商品、品牌故事與最新活動。";

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`
    },
    description
  };
}

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

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
