import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes } from "react";
import { requireAdminSession } from "@/lib/rbac";
import {
  getAdminCategoriesWithProductCount,
  getAdminMerchants
} from "@/modules/catalog/product.repository";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction
} from "@/app/admin/(protected)/categories/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品分類"
};

type AdminCategoriesPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const params = (await searchParams) ?? {};
  const session = await requireAdminSession();
  const [merchants, categories] = await Promise.all([
    getAdminMerchants(session),
    getAdminCategoriesWithProductCount(session)
  ]);
  const defaultMerchantId = session.role === "merchant" && session.merchantId
    ? session.merchantId
    : merchants[0]?.id || "";

  return (
    <div className="space-y-8" data-testid="admin-categories-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 商品管理 / 商品分類
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">商品分類</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            建立商品分類後，商品新增與編輯表單就能直接選用，也會同步顯示在前台商品資訊中。
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
        >
          返回商品總覽
        </Link>
      </section>

      {params.message ? (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {params.message}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-ink">新增分類</h3>
        <p className="mt-1 text-sm text-muted">
          網址代號會用於系統辨識，建議使用英文小寫與連字號，例如 smart-lock。
        </p>
        <form action={createCategoryAction} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-ink">商家</span>
            <select
              name="merchantId"
              defaultValue={defaultMerchantId}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-category-merchantId"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <TextField label="分類名稱" name="name" testId="admin-category-name" required />
          <TextField
            label="網址代號（Slug）"
            name="slug"
            testId="admin-category-slug"
            placeholder="smart-lock"
            required
          />
          <div className="flex items-end">
            <button
              type="submit"
              className="min-h-12 w-full rounded bg-ink px-5 text-sm font-semibold text-white hover:bg-slate-800"
              data-testid="admin-category-create"
            >
              新增分類
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="border-b border-line p-5">
          <h3 className="text-lg font-bold text-ink">分類列表</h3>
          <p className="mt-1 text-sm text-muted">共 {categories.length} 個分類。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink text-xs font-semibold text-white">
              <tr>
                <th className="px-5 py-4">分類名稱</th>
                <th className="px-5 py-4">網址代號</th>
                <th className="px-5 py-4">商家</th>
                <th className="px-5 py-4">商品數</th>
                <th className="px-5 py-4">最後更新</th>
                <th className="px-5 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50" data-testid="admin-category-row">
                    <td className="px-5 py-4">
                      <form
                        id={`category-${category.id}`}
                        action={updateCategoryAction.bind(null, category.id)}
                        className="contents"
                      >
                        <input type="hidden" name="merchantId" value={category.merchantId} />
                        <input
                          name="name"
                          defaultValue={category.name}
                          className="min-h-11 w-56 rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
                          data-testid="admin-category-edit-name"
                        />
                      </form>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        form={`category-${category.id}`}
                        name="slug"
                        defaultValue={category.slug}
                        className="min-h-11 w-56 rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
                        data-testid="admin-category-edit-slug"
                      />
                    </td>
                    <td className="px-5 py-4 text-muted">{category.merchant.name}</td>
                    <td className="px-5 py-4 text-muted">{category._count.products}</td>
                    <td className="px-5 py-4 text-muted">
                      {category.updatedAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          form={`category-${category.id}`}
                          type="submit"
                          className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-brand-500"
                          data-testid="admin-category-update"
                        >
                          儲存
                        </button>
                        <form action={deleteCategoryAction.bind(null, category.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={category._count.products > 0}
                            title={
                              category._count.products > 0
                                ? "此分類仍有商品使用，不能刪除"
                                : "刪除此分類"
                            }
                            data-testid="admin-category-delete"
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
                  <td colSpan={6} className="px-5 py-16 text-center text-muted">
                    目前沒有商品分類。
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

function TextField({
  label,
  name,
  testId,
  ...props
}: {
  label: string;
  name: string;
  testId: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={testId}
        {...props}
      />
    </label>
  );
}
