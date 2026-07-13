import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { getPublishedNavigationPages } from "@/modules/content/page.repository";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

export const dynamic = "force-dynamic";

const pageTypeLabels: Record<PageTypeValue, string> = {
  brand: "品牌頁",
  landing: "形象廣告頁",
  content: "內容頁"
};

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSettingSafely();

  return {
    title: siteSetting?.seoTitle || siteSetting?.siteName || "AIH 品牌商城",
    description:
      siteSetting?.seoDescription ||
      "AIH 品牌商城提供品牌內容、商品型錄與電商購物體驗。"
  };
}

export default async function HomePage() {
  const [pages, siteSetting] = await Promise.all([
    getPublishedPagesSafely(),
    getPublicSiteSettingSafely()
  ]);
  const siteName = siteSetting?.siteName || "AIH 品牌商城";
  const primaryColor = siteSetting?.primaryColor || "#2563eb";
  const highlights = [
    "品牌形象官網",
    "形象廣告頁",
    "商品型錄",
    "後台管理"
  ];

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: primaryColor }}
            >
              品牌電商 CMS
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              {siteName}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              {siteSetting?.seoDescription ||
                "用一套後台管理品牌內容、商品型錄、購物流程與訂單營運。前台支援響應式頁面與 SEO，適合逐步擴充成完整電商平台。"}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-full px-6 py-3 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                查看商品
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
              >
                品牌介紹
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-ink">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    從後台維護內容、圖片、SEO、商品與訂單資料，並同步到前台呈現。
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {pages.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.2em]"
                style={{ color: primaryColor }}
              >
                網站頁面
              </p>
              <h2 className="mt-3 text-3xl font-bold text-ink">探索更多內容</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                後台發布的 CMS 頁面會自動顯示在這裡，訪客可以直接點選查看。
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={getPublicPageHref(page)}
                className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-brand-500"
              >
                <span className="text-xs font-semibold" style={{ color: primaryColor }}>
                  {pageTypeLabels[page.type as PageTypeValue]}
                </span>
                <h3 className="mt-3 text-lg font-bold text-ink">{page.title}</h3>
                {page.heroSubtitle ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {page.heroSubtitle}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function getPublicPageHref(page: { slug: string; type: string }) {
  if (page.type === PageType.brand) {
    return "/about";
  }

  if (page.type === PageType.landing) {
    return `/landing/${page.slug}`;
  }

  return `/pages/${page.slug}`;
}

async function getPublishedPagesSafely() {
  try {
    return await getPublishedNavigationPages();
  } catch {
    return [];
  }
}

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
