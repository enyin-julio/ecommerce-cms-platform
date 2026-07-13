import Link from "next/link";
import type { Metadata } from "next";
import type { PageType as PageTypeValue } from "@/lib/domain-types";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminPages } from "@/modules/content/page.repository";
import {
  deletePageAction,
  togglePagePublishedAction
} from "@/app/admin/(protected)/pages/actions";

export const metadata: Metadata = {
  title: "CMS 頁面管理"
};

const typeLabels: Record<PageTypeValue, string> = {
  brand: "品牌形象頁",
  landing: "形象廣告頁",
  content: "一般內容頁"
};

export default async function AdminPagesPage() {
  const session = await requireAdminSession();
  const pages = await getAdminPagesSafely(session);

  return (
    <div className="space-y-6" data-testid="admin-pages-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            CMS 頁面
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">頁面列表</h2>
          <p className="mt-2 text-sm text-muted">
            {session.role === "admin"
              ? "系統管理員可查看並管理所有商家的 CMS 頁面。"
              : "商家帳號只能查看與管理自己名下的 CMS 頁面。"}
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
          data-testid="admin-page-new-link"
        >
          新增頁面
        </Link>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">標題</th>
                <th className="px-5 py-3 font-semibold">網址代號（Slug）</th>
                <th className="px-5 py-3 font-semibold">類型</th>
                <th className="px-5 py-3 font-semibold">商家</th>
                <th className="px-5 py-3 font-semibold">狀態</th>
                <th className="px-5 py-3 font-semibold">最後更新</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50" data-testid="admin-page-row">
                    <td className="px-5 py-4 font-semibold text-ink">{page.title}</td>
                    <td className="px-5 py-4 text-muted">/{page.slug}</td>
                    <td className="px-5 py-4 text-muted">
                      {typeLabels[page.type as PageTypeValue]}
                    </td>
                    <td className="px-5 py-4 text-muted">{page.merchant.name}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">
                        {page.isPublished ? "已發布" : "未發布"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {page.updatedAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/pages/${page.id}/edit`}
                          className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500"
                          data-testid="admin-page-edit-link"
                        >
                          編輯
                        </Link>
                        <form action={togglePagePublishedAction.bind(null, page.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500"
                            data-testid="admin-page-toggle"
                          >
                            {page.isPublished ? "下架" : "發布"}
                          </button>
                        </form>
                        <form action={deletePageAction.bind(null, page.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
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
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    目前沒有 CMS 頁面資料。
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

async function getAdminPagesSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminPages(session);
  } catch {
    return [];
  }
}
