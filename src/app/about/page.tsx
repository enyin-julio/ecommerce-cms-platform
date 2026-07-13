import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "品牌介紹",
  description: "了解 AIH 品牌商城的品牌理念、網站內容與電商服務。"
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          品牌故事
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          用清楚的內容與穩定的購物流程，打造可信任的品牌網站
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
          這套平台協助商家整理品牌形象、商品資訊、形象廣告頁與 SEO 內容，
          並保留後續擴充金流、物流與會員經營的空間。
        </p>
      </section>
    </main>
  );
}
