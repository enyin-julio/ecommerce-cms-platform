import Link from "next/link";
import type { Metadata } from "next";
import { formatCurrency } from "@/lib/format";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminProducts } from "@/modules/catalog/product.repository";
import { toggleProductPublishedAction } from "@/app/admin/(protected)/products/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品管理"
};

export default async function AdminProductsPage() {
  const session = await requireAdminSession();
  const products = await getAdminProductsSafely(session);

  return (
    <div className="space-y-6" data-testid="admin-products-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Products
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">商品管理</h2>
          <p className="mt-2 text-sm text-muted">
            {session.role === "admin"
              ? "管理者可查看與管理全部商品。"
              : "商家只能查看與管理自己的商品。"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
          data-testid="admin-product-new-link"
        >
          新增商品
        </Link>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">商品</th>
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">商家</th>
                <th className="px-5 py-3 font-semibold">分類</th>
                <th className="px-5 py-3 font-semibold">售價</th>
                <th className="px-5 py-3 font-semibold">庫存</th>
                <th className="px-5 py-3 font-semibold">狀態</th>
                <th className="px-5 py-3 font-semibold">更新時間</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50" data-testid="admin-product-row">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="mt-1 text-xs text-muted">/{product.slug}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted">{product.sku}</td>
                    <td className="px-5 py-4 text-muted">{product.merchant.name}</td>
                    <td className="px-5 py-4 text-muted">
                      {product.category?.name || "未分類"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">
                      {formatCurrency(product.price.toString())}
                    </td>
                    <td className="px-5 py-4 text-muted">{product.stock}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">
                        {product.isPublished ? "已上架" : "已下架"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {product.updatedAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500"
                          data-testid="admin-product-edit-link"
                        >
                          編輯
                        </Link>
                        <form action={toggleProductPublishedAction.bind(null, product.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500"
                            data-testid="admin-product-toggle"
                          >
                            {product.isPublished ? "下架" : "上架"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted">
                    目前沒有商品資料。
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

async function getAdminProductsSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminProducts(session);
  } catch {
    return [];
  }
}
