import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "品牌形象",
  description: "品牌形象頁示範，後續會由 CMS Page 模組管理。"
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Brand story
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          讓品牌內容與商品銷售共用同一套後台
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
          這個頁面先建立品牌形象版型骨架。下一階段會接上 Page CMS，讓商家自行編輯 Hero、
          內容區塊、SEO 標題與描述。
        </p>
      </section>
    </main>
  );
}
