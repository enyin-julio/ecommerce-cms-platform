import Link from "next/link";
import type { Metadata } from "next";
import { PageType, type PageType as PageTypeValue } from "@/lib/domain-types";
import { getNavigationGroupLabel } from "@/lib/page-navigation";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminPages } from "@/modules/content/page.repository";
import {
  deletePageAction,
  togglePagePublishedAction
} from "@/app/admin/(protected)/pages/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "頁面管理"
};

const typeLabels: Record<PageTypeValue, string> = {
  brand: "品牌形象頁",
  landing: "形象廣告頁",
  content: "一般內容頁"
};

type AdminPagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AdminPageItem = Awaited<ReturnType<typeof getAdminPages>>[number];

export default async function AdminPagesPage({ searchParams }: AdminPagesPageProps) {
  const session = await requireAdminSession();
  const params = (await searchParams) ?? {};
  const keyword = getParam(params.keyword);
  const type = getParam(params.type) || "all";
  const publishedStatus = getParam(params.publishedStatus) || "all";
  const pages = await getAdminPagesSafely(session);
  const filteredPages = pages.filter((page) =>
    matchesFilters(page, {
      keyword,
      type,
      publishedStatus
    })
  );
  const publishedCount = pages.filter((page) => page.isPublished).length;

  return (
    <div className="space-y-8" data-testid="admin-pages-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 頁面管理 / CMS 頁面
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">頁面總覽</h2>
          <p className="mt-3 text-sm text-muted">
            {session.role === "admin"
              ? "系統管理員可查看並管理所有商家的品牌頁、形象廣告頁與一般內容頁。"
              : "商家可管理自己的品牌頁、形象廣告頁與一般內容頁。"}
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          data-testid="admin-page-new-link"
        >
          新增頁面
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="全部頁面" value={pages.length} />
        <SummaryCard label="已發布" value={publishedCount} />
        <SummaryCard label="未發布" value={pages.length - publishedCount} />
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 border-b border-line pb-5">
          <span className="border-b-2 border-amber-500 pb-3 text-sm font-semibold text-ink">
            頁面總覽
          </span>
          <span className="pb-3 text-sm font-semibold text-muted">前台顯示</span>
        </div>

        <form className="mt-6 space-y-4" action="/admin/pages" data-testid="admin-page-filter-form">
          <div>
            <label htmlFor="keyword" className="text-sm font-semibold text-ink">
              頁面查詢
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="keyword"
                name="keyword"
                defaultValue={keyword}
                placeholder="搜尋頁面標題、網址代號、Hero 標題"
                className="min-h-12 flex-1 rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                data-testid="admin-page-keyword"
              />
              <button
                type="submit"
                className="min-h-12 rounded border border-line px-5 text-sm font-semibold text-ink hover:border-brand-500"
                data-testid="admin-page-search"
              >
                搜尋
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FilterSelect
              label="頁面類型"
              name="type"
              value={type}
              options={[
                ["all", "全部頁面類型"],
                [PageType.brand, "品牌形象頁"],
                [PageType.landing, "形象廣告頁"],
                [PageType.content, "一般內容頁"]
              ]}
              testId="admin-page-type-filter"
            />
            <FilterSelect
              label="發布狀態"
              name="publishedStatus"
              value={publishedStatus}
              options={[
                ["all", "全部發布狀態"],
                ["published", "已發布"],
                ["draft", "未發布"]
              ]}
              testId="admin-page-published-filter"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button
              type="submit"
              className="rounded bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              套用篩選
            </button>
            <Link
              href="/admin/pages"
              className="rounded border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
            >
              清除條件
            </Link>
            <p className="ml-auto text-sm text-muted">共 {filteredPages.length} 筆頁面</p>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink text-xs font-semibold text-white">
              <tr>
                <th className="px-5 py-4">頁面名稱</th>
                <th className="px-5 py-4">頁面類型</th>
                <th className="px-5 py-4">前台選單</th>
                <th className="px-5 py-4">商家</th>
                <th className="px-5 py-4">發布狀態</th>
                <th className="px-5 py-4">最後更新</th>
                <th className="px-5 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50" data-testid="admin-page-row">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{page.title}</p>
                      {page.heroTitle ? (
                        <p className="mt-1 text-xs text-muted">Hero：{page.heroTitle}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">網址代號：{page.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {typeLabels[page.type as PageTypeValue]}
                    </td>
                    <td className="px-5 py-4">
                      {page.showInNavigation && page.isPublished ? (
                        <Link
                          href={getPublicPageHref(page)}
                          className="font-semibold text-brand-700 hover:text-brand-800"
                          target="_blank"
                        >
                          {getNavigationGroupLabel(page.navigationGroup)}
                          <span className="ml-2 text-xs font-normal text-muted">
                            排序 {page.navigationOrder}
                          </span>
                        </Link>
                      ) : page.isPublished ? (
                        <span className="text-muted">已發布，不顯示於選單</span>
                      ) : (
                        <span className="text-muted">發布後可設定選單</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">{page.merchant.name}</td>
                    <td className="px-5 py-4">
                      <PublishedBadge isPublished={page.isPublished} />
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {page.updatedAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/pages/${page.id}/edit`}
                          className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-brand-500"
                          data-testid="admin-page-edit-link"
                        >
                          編輯
                        </Link>
                        <form action={togglePagePublishedAction.bind(null, page.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-brand-500"
                            data-testid="admin-page-toggle"
                          >
                            {page.isPublished ? "下架" : "發布"}
                          </button>
                        </form>
                        <form action={deletePageAction.bind(null, page.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
                            data-testid="admin-page-delete"
                          >
                            刪除
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted">
                    目前沒有符合條件的頁面資料。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function matchesFilters(
  page: AdminPageItem,
  filters: {
    keyword: string;
    type: string;
    publishedStatus: string;
  }
) {
  const keyword = filters.keyword.trim().toLowerCase();
  const keywordMatched = keyword
    ? [page.title, page.slug, page.heroTitle ?? "", page.heroSubtitle ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    : true;
  const typeMatched = filters.type === "all" || page.type === filters.type;
  const publishedMatched =
    filters.publishedStatus === "all" ||
    (filters.publishedStatus === "published" && page.isPublished) ||
    (filters.publishedStatus === "draft" && !page.isPublished);

  return keywordMatched && typeMatched && publishedMatched;
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isPublished ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-muted"
      }`}
    >
      {isPublished ? "已發布" : "未發布"}
    </span>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
  testId
}: {
  label: string;
  name: string;
  value: string;
  options: [string, string][];
  testId: string;
}) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm font-normal text-ink outline-none focus:border-brand-500"
        data-testid={testId}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

async function getAdminPagesSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminPages(session);
  } catch {
    return [];
  }
}
