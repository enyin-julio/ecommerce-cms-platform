import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { getPublishedProducts } from "@/modules/catalog/product.repository";
import {
  getPublishedBrandPage,
  getPublishedNavigationPages
} from "@/modules/content/page.repository";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

export const dynamic = "force-dynamic";

const pageTypeLabels: Record<PageTypeValue, string> = {
  brand: "品牌介紹",
  landing: "最新活動",
  content: "服務資訊"
};

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSettingSafely();

  return {
    title: siteSetting?.seoTitle || siteSetting?.siteName || "AIH 品牌商城",
    description:
      siteSetting?.seoDescription ||
      "探索 AIH 品牌商城的精選商品、品牌故事與最新活動。"
  };
}

export default async function HomePage() {
  const [pages, products, brandPage, siteSetting] = await Promise.all([
    getPublishedPagesSafely(),
    getPublishedProductsSafely(),
    getPublishedBrandPageSafely(),
    getPublicSiteSettingSafely()
  ]);
  const siteName = siteSetting?.siteName || "AIH 品牌商城";
  const primaryColor = siteSetting?.primaryColor || "#2563eb";
  const heroTitle = brandPage?.heroTitle || siteName;
  const heroDescription =
    brandPage?.heroSubtitle ||
    siteSetting?.seoDescription ||
    "精選實用商品與品牌服務，提供安心、清楚、便利的購物體驗。";
  const heroImageUrl = brandPage?.heroImageUrl || siteSetting?.logoUrl || "";
  const landingPages = pages.filter((page) => page.type === PageType.landing);
  const contentPages = pages.filter((page) => page.type !== PageType.brand);
  const featuredProducts = products.slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: primaryColor }}
            >
              精選品牌商城
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{heroDescription}</p>
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

          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            {heroImageUrl ? (
              <div
                className="aspect-[4/3] bg-slate-100 bg-cover bg-center"
                style={{ backgroundImage: `url("${heroImageUrl}")` }}
                aria-label={`${heroTitle} 主視覺`}
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-slate-50 p-8">
                <div className="text-center">
                  <div
                    className="mx-auto grid h-20 w-20 place-items-center rounded-lg text-3xl font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {siteName.slice(0, 1)}
                  </div>
                  <p className="mt-5 text-sm text-muted">歡迎探索我們的精選商品與品牌服務。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {landingPages.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading
            eyebrow="最新消息"
            title="活動與品牌主題"
            description="掌握近期活動、品牌企劃與精選推薦。"
            color={primaryColor}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {landingPages.slice(0, 2).map((page) => (
              <Link
                key={page.id}
                href={getPublicPageHref(page)}
                className="group overflow-hidden rounded-lg border border-line bg-white shadow-sm hover:border-brand-500"
              >
                {page.heroImageUrl ? (
                  <div
                    className="aspect-[16/9] bg-slate-100 bg-cover bg-center"
                    style={{ backgroundImage: `url("${page.heroImageUrl}")` }}
                    aria-label={`${page.title} 圖片`}
                  />
                ) : null}
                <div className="p-5">
                  <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                    {pageTypeLabels[page.type as PageTypeValue]}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-ink group-hover:text-brand-700">
                    {page.title}
                  </h3>
                  {page.heroSubtitle ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                      {page.heroSubtitle}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featuredProducts.length > 0 ? (
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="精選商品"
                title="值得推薦的商品"
                description="為你整理近期精選商品，快速找到適合的選擇。"
                color={primaryColor}
              />
              <Link
                href="/products"
                className="w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
              >
                查看全部商品
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="overflow-hidden rounded-lg border border-line bg-white shadow-sm hover:border-brand-500"
                >
                  {product.imageUrl ? (
                    <div
                      className="aspect-[4/3] bg-slate-100 bg-cover bg-center"
                      style={{ backgroundImage: `url("${product.imageUrl}")` }}
                      aria-label={`${product.name} 商品圖`}
                    />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center bg-white text-sm text-muted">
                      商品圖片準備中
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-muted">{product.category?.name || "未分類"}</p>
                    <h3 className="mt-2 text-lg font-bold text-ink">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                      {product.shortDescription}
                    </p>
                    <p className="mt-4 text-lg font-bold text-ink">
                      {formatCurrency(product.price.toString())}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {brandPage || contentPages.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading
            eyebrow="了解更多"
            title="品牌與服務"
            description="查看品牌故事、服務說明與購物相關資訊。"
            color={primaryColor}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandPage ? (
              <ContentCard
                href="/about"
                title={brandPage.title}
                label="品牌介紹"
                description={brandPage.heroSubtitle}
                color={primaryColor}
              />
            ) : null}
            {contentPages.slice(0, 5).map((page) => (
              <ContentCard
                key={page.id}
                href={getPublicPageHref(page)}
                title={page.title}
                label={pageTypeLabels[page.type as PageTypeValue]}
                description={page.heroSubtitle}
                color={primaryColor}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  color
}: {
  eyebrow: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function ContentCard({
  href,
  title,
  label,
  description,
  color
}: {
  href: string;
  title: string;
  label: string;
  description?: string | null;
  color: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-brand-500">
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
      <h3 className="mt-3 text-lg font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </Link>
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

async function getPublishedProductsSafely() {
  try {
    return await getPublishedProducts();
  } catch {
    return [];
  }
}

async function getPublishedBrandPageSafely() {
  try {
    return await getPublishedBrandPage();
  } catch {
    return null;
  }
}

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
