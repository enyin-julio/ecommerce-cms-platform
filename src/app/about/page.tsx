import type { Metadata } from "next";
import { CmsPageContent } from "@/components/public/cms-page-content";
import { SiteHeader } from "@/components/public/site-header";
import { productImagePlaceholder } from "@/lib/placeholders";
import { getPublishedBrandPage } from "@/modules/content/page.repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getBrandPageSafely();

  return {
    title: page?.seoTitle || page?.title || "品牌介紹",
    description:
      page?.seoDescription ||
      page?.heroSubtitle ||
      "了解 AIH 品牌商城的品牌理念、網站內容與電商服務。"
  };
}

export default async function AboutPage() {
  const page = await getBrandPageSafely();

  if (page) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <section
          className="bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.96)), url(${page.heroImageUrl || productImagePlaceholder})`
          }}
        >
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              品牌介紹
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {page.heroTitle || page.title}
            </h1>
            {page.heroSubtitle ? (
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
                {page.heroSubtitle}
              </p>
            ) : null}
          </div>
        </section>
        <CmsPageContent blocks={page.contentBlocks} />
      </main>
    );
  }

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

async function getBrandPageSafely() {
  try {
    return await getPublishedBrandPage();
  } catch {
    return null;
  }
}
