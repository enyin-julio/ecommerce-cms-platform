import Link from "next/link";
import { getPublishedNavigationPages } from "@/modules/content/page.repository";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";

const pageTypeLabels: Record<PageTypeValue, string> = {
  brand: "品牌頁",
  landing: "形象廣告頁",
  content: "內容頁"
};

export async function SiteHeader() {
  const pages = await getPublishedNavigationPagesSafely();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          AIH 品牌商城
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
          <Link className="hover:text-ink" href="/about">
            品牌介紹
          </Link>
          <Link className="hover:text-ink" href="/products">
            商品
          </Link>
          {pages.length > 0 ? (
            <details className="group relative">
              <summary className="cursor-pointer list-none hover:text-ink">
                網站頁面
              </summary>
              <div className="absolute left-0 top-8 z-30 w-72 rounded-lg border border-line bg-white p-3 shadow-soft">
                <div className="grid gap-1">
                  {pages.map((page) => (
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
          <Link className="hover:text-ink" href="/account">
            會員中心
          </Link>
          <Link className="hover:text-ink" href="/login">
            登入
          </Link>
          <Link
            className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            href="/admin"
          >
            後台
          </Link>
        </nav>
      </div>
    </header>
  );
}

function getPublicPageHref(page: { slug: string; type: string }) {
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
