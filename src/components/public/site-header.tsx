import Image from "next/image";
import Link from "next/link";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { getCurrentCustomer } from "@/lib/customer-session";
import { navigationGroups } from "@/lib/page-navigation";
import { getPublishedNavigationPages } from "@/modules/content/page.repository";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

const pageTypeLabels: Record<PageTypeValue, string> = {
  brand: "品牌形象頁",
  landing: "形象廣告頁",
  content: "一般內容頁"
};

export async function SiteHeader() {
  const [pages, siteSetting, customer] = await Promise.all([
    getPublishedNavigationPagesSafely(),
    getPublicSiteSettingSafely(),
    getCurrentCustomerSafely()
  ]);
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";
  const brandPage = pages.find((page) => page.type === PageType.brand);
  const groupedPages = navigationGroups
    .map((group) => ({
      ...group,
      pages: pages.filter((page) => page.navigationGroup === group.value)
    }))
    .filter((group) => group.pages.length > 0);
  const headerStyle = siteSetting?.themeHeaderStyle || "header-1";
  const navigationStyle = siteSetting?.themeNavigationStyle || "standard";
  const shellClass = getHeaderShellClass(headerStyle);
  const navClass = getNavClass(navigationStyle);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className={shellClass}>
        <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-tight text-ink">
          {siteSetting?.logoUrl ? (
            <Image
              src={siteSetting.logoUrl}
              alt={`${siteName} Logo`}
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-contain"
            />
          ) : null}
          <span>{siteName}</span>
        </Link>
        <nav className={navClass} aria-label="前台導覽">
          <Link className="hover:text-ink" href="/about">
            {brandPage?.title || "品牌介紹"}
          </Link>
          <Link className="hover:text-ink" href="/products">
            商品
          </Link>
          {groupedPages.map((group) => (
            <details key={group.value} className="group relative">
              <summary className="cursor-pointer list-none hover:text-ink">
                {group.label}
              </summary>
              <div className="absolute left-0 top-8 z-30 w-72 rounded-lg border border-line bg-white p-3 shadow-soft">
                <div className="grid gap-1">
                  {group.pages.map((page) => (
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
          ))}
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

function getHeaderShellClass(headerStyle: string) {
  const base = "mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:px-6";

  if (headerStyle === "header-2") {
    return `${base} items-center py-5 text-center`;
  }

  if (headerStyle === "header-3") {
    return `${base} py-6 lg:flex-row lg:items-center lg:justify-between`;
  }

  if (headerStyle === "header-4") {
    return `${base} py-3 lg:flex-row lg:items-center lg:justify-between`;
  }

  return `${base} py-4 lg:flex-row lg:items-center lg:justify-between`;
}

function getNavClass(navigationStyle: string) {
  const base = "flex flex-wrap items-center text-sm font-medium text-muted";

  if (navigationStyle === "centered") {
    return `${base} justify-center gap-x-5 gap-y-2`;
  }

  if (navigationStyle === "compact") {
    return `${base} gap-x-3 gap-y-2 text-xs`;
  }

  return `${base} gap-x-4 gap-y-2`;
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
