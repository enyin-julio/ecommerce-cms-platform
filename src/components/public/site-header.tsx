import Image from "next/image";
import Link from "next/link";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getPublishedNavigationPages } from "@/modules/content/page.repository";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

const pageTypeLabels: Record<PageTypeValue, string> = {
  brand: "品牌介紹",
  landing: "活動頁",
  content: "內容頁"
};

export async function SiteHeader() {
  const [pages, siteSetting, customer] = await Promise.all([
    getPublishedNavigationPagesSafely(),
    getPublicSiteSettingSafely(),
    getCurrentCustomerSafely()
  ]);
  const siteName = siteSetting?.siteName || "AIH 品牌商城";
  const brandPage = pages.find((page) => page.type === PageType.brand);
  const navPages = pages.filter((page) => page.type !== PageType.brand);
  const directNavPages = navPages.slice(0, 4);
  const moreNavPages = navPages.slice(4);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-tight text-ink">
          {siteSetting?.logoUrl ? (
            <Image
              src={siteSetting.logoUrl}
              alt={`${siteName} Logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-md object-contain"
            />
          ) : null}
          <span>{siteName}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
          <Link className="hover:text-ink" href="/about">
            {brandPage?.title || "品牌介紹"}
          </Link>
          <Link className="hover:text-ink" href="/products">
            商品
          </Link>
          {directNavPages.map((page) => (
            <Link key={page.id} className="hover:text-ink" href={getPublicPageHref(page)}>
              {page.title}
            </Link>
          ))}
          {moreNavPages.length > 0 ? (
            <details className="group relative">
              <summary className="cursor-pointer list-none hover:text-ink">
                更多頁面
              </summary>
              <div className="absolute left-0 top-8 z-30 w-72 rounded-lg border border-line bg-white p-3 shadow-soft">
                <div className="grid gap-1">
                  {moreNavPages.map((page) => (
                    <Link
                      key={page.id}
                      href={getPublicPageHref(page)}
                      className="rounded-md px-3 py-2 hover:bg-slate-50 hover:text-ink"
                    >
                      <span className="block font-semibold text-ink">{page.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {pageTypeLabels[page.type as PageTypeValue]}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
          <Link className="hover:text-ink" href="/cart">
            購物車
          </Link>
          {customer ? (
            <>
              <Link
                className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                href="/account"
              >
                會員中心
              </Link>
              <Link className="hover:text-ink" href="/logout">
                登出
              </Link>
            </>
          ) : (
            <>
              <Link className="hover:text-ink" href="/login">
                登入
              </Link>
              <Link
                className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                href="/register"
              >
                註冊
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
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

async function getPublishedNavigationPagesSafely() {
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

async function getCurrentCustomerSafely() {
  try {
    return await getCurrentCustomer();
  } catch {
    return null;
  }
}
