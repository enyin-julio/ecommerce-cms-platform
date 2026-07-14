import Link from "next/link";
import type { Metadata } from "next";
import { formatCurrency } from "@/lib/format";
import { requireAdminSession } from "@/lib/rbac";
import {
  getAdminCategories,
  getAdminProducts
} from "@/modules/catalog/product.repository";
import { toggleProductPublishedAction } from "@/app/admin/(protected)/products/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品管理"
};

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ProductListItem = Awaited<ReturnType<typeof getAdminProducts>>[number];

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const session = await requireAdminSession();
  const params = (await searchParams) ?? {};
  const keyword = getParam(params.keyword);
  const publishedStatus = getParam(params.publishedStatus) || "all";
  const stockStatus = getParam(params.stockStatus) || "all";
  const categoryId = getParam(params.categoryId) || "all";

  const [products, categories] = await Promise.all([
    getAdminProductsSafely(session),
    getAdminCategoriesSafely(session)
  ]);

  const filteredProducts = products.filter((product) =>
    matchesFilters(product, {
      keyword,
      publishedStatus,
      stockStatus,
      categoryId
    })
  );

  return (
    <div className="space-y-8" data-testid="admin-products-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 商品管理 / 商品總覽
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">商品總覽</h2>
          <p className="mt-3 text-sm text-muted">
            {session.role === "admin"
              ? "系統管理員可查看並管理所有商家的商品資料。"
              : "商家可管理自己的商品、庫存與上下架狀態。"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          data-testid="admin-product-new-link"
        >
          新增商品
        </Link>
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 border-b border-line pb-5">
          <span className="border-b-2 border-amber-500 pb-3 text-sm font-semibold text-ink">
            商品總覽
          </span>
          <Link href="/admin/categories" className="pb-3 text-sm font-semibold text-muted hover:text-ink">
            商品分類
          </Link>
        </div>

        <form className="mt-6 space-y-4" action="/admin/products" data-testid="admin-product-filter-form">
          <div>
            <label htmlFor="keyword" className="text-sm font-semibold text-ink">
              商品查詢
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="keyword"
                name="keyword"
                defaultValue={keyword}
                placeholder="搜尋商品名稱、SKU、網址代號"
                className="min-h-12 flex-1 rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                data-testid="admin-product-keyword"
              />
              <button
                type="submit"
                className="min-h-12 rounded border border-line px-5 text-sm font-semibold text-ink hover:border-brand-500"
                data-testid="admin-product-search"
              >
                搜尋
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FilterSelect
              label="商品狀態"
              name="publishedStatus"
              value={publishedStatus}
              options={[
                ["all", "全部商品狀態"],
                ["published", "上架中"],
                ["draft", "已下架"]
              ]}
              testId="admin-product-published-filter"
            />
            <FilterSelect
              label="庫存狀態"
              name="stockStatus"
              value={stockStatus}
              options={[
                ["all", "全部庫存狀態"],
                ["normal", "正常"],
                ["low", "低庫存"],
                ["empty", "無庫存"]
              ]}
              testId="admin-product-stock-filter"
            />
            <FilterSelect
              label="主分類"
              name="categoryId"
              value={categoryId}
              options={[
                ["all", "全部分類"],
                ...categories.map((category) => [category.id, category.name] as [string, string])
              ]}
              testId="admin-product-category-filter"
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
              href="/admin/products"
              className="rounded border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
            >
              清除條件
            </Link>
            <p className="ml-auto text-sm text-muted">
              共 {filteredProducts.length} 筆商品
            </p>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="w-fit rounded border border-line px-5 py-3 text-sm font-semibold text-muted"
            disabled
          >
            更多操作
          </button>
          <p className="text-sm text-muted">批次分類、批次狀態調整會在後續營運工具階段補上。</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-xs font-semibold text-white">
                <tr>
                  <th className="px-5 py-4">封面圖</th>
                  <th className="px-5 py-4">商品名稱</th>
                  <th className="px-5 py-4">商品類型</th>
                  <th className="px-5 py-4">售價</th>
                  <th className="px-5 py-4">庫存狀態</th>
                  <th className="px-5 py-4">商品狀態</th>
                  <th className="px-5 py-4">上/下架時間</th>
                  <th className="px-5 py-4">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50" data-testid="admin-product-row">
                      <td className="px-5 py-4">
                        <ProductCover product={product} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">{product.name}</p>
                        <p className="mt-1 text-xs text-muted">SKU：{product.sku}</p>
                        <p className="mt-1 text-xs text-muted">網址代號：/{product.slug}</p>
                        <p className="mt-1 text-xs text-muted">
                          分類：{product.category?.name || "未分類"}
                        </p>
                        {session.role === "admin" ? (
                          <p className="mt-1 text-xs text-muted">商家：{product.merchant.name}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-muted">實體商品</td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatCurrency(product.price.toString())}
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge stock={product.stock} />
                      </td>
                      <td className="px-5 py-4">
                        <PublishedBadge isPublished={product.isPublished} />
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {product.updatedAt.toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-brand-500"
                            data-testid="admin-product-edit-link"
                          >
                            編輯
                          </Link>
                          <form action={toggleProductPublishedAction.bind(null, product.id)}>
                            <button
                              type="submit"
                              className="rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-brand-500"
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
                    <td colSpan={8} className="px-5 py-16 text-center text-muted">
                      目前沒有符合條件的商品資料。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function matchesFilters(
  product: ProductListItem,
  filters: {
    keyword: string;
    publishedStatus: string;
    stockStatus: string;
    categoryId: string;
  }
) {
  const keyword = filters.keyword.trim().toLowerCase();
  const keywordMatched = keyword
    ? [product.name, product.sku, product.slug, product.category?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    : true;

  const publishedMatched =
    filters.publishedStatus === "all" ||
    (filters.publishedStatus === "published" && product.isPublished) ||
    (filters.publishedStatus === "draft" && !product.isPublished);

  const stock = getStockStatus(product.stock);
  const stockMatched = filters.stockStatus === "all" || stock === filters.stockStatus;

  const categoryMatched =
    filters.categoryId === "all" || product.categoryId === filters.categoryId;

  return keywordMatched && publishedMatched && stockMatched && categoryMatched;
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return "empty";
  }

  if (stock <= 5) {
    return "low";
  }

  return "normal";
}

function ProductCover({ product }: { product: ProductListItem }) {
  if (!product.imageUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-line bg-slate-50 text-xs text-muted">
        無圖
      </div>
    );
  }

  return (
    <div
      className="h-16 w-16 rounded border border-line bg-cover bg-center"
      style={{
        backgroundImage: `url("${product.imageUrl}")`
      }}
      aria-label={`${product.name} 封面圖`}
    />
  );
}

function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);
  const styles = {
    normal: "bg-emerald-50 text-emerald-700",
    low: "bg-amber-50 text-amber-700",
    empty: "bg-rose-50 text-rose-700"
  }[status];
  const label = {
    normal: "正常",
    low: "低庫存",
    empty: "無庫存"
  }[status];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}，{stock} 件
    </span>
  );
}

function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isPublished ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-muted"
      }`}
    >
      {isPublished ? "上架中" : "已下架"}
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

async function getAdminProductsSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminProducts(session);
  } catch {
    return [];
  }
}

async function getAdminCategoriesSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminCategories(session);
  } catch {
    return [];
  }
}
