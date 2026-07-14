import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/public/product-card";
import { SiteHeader } from "@/components/public/site-header";
import {
  getPublishedProductCategories,
  getPublishedProducts
} from "@/modules/catalog/product.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品列表",
  description: "瀏覽 AIH 品牌商城目前已上架的商品。"
};

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PublishedProduct = Awaited<ReturnType<typeof getPublishedProducts>>[number];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const selectedCategorySlug = getParam(params.category);
  const keyword = getParam(params.q).trim();
  const [products, categories] = await Promise.all([
    getProductsSafely(),
    getCategoriesSafely()
  ]);
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);
  const filteredProducts = products.filter((product) =>
    matchesFilters(product, {
      categorySlug: selectedCategorySlug,
      keyword
    })
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              商品型錄
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {selectedCategory ? selectedCategory.name : "商品列表"}
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            這裡只會顯示已上架商品。可依分類篩選，也可搜尋商品名稱、SKU、描述或分類。
          </p>
        </div>

        <form
          action="/products"
          className="mt-8 rounded-lg border border-line bg-white p-4 shadow-sm"
          data-testid="product-search-form"
        >
          {selectedCategorySlug ? (
            <input type="hidden" name="category" value={selectedCategorySlug} />
          ) : null}
          <label htmlFor="q" className="text-sm font-semibold text-ink">
            搜尋商品
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="q"
              name="q"
              defaultValue={keyword}
              placeholder="輸入商品名稱、SKU、分類或描述"
              className="min-h-12 flex-1 rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="product-search-input"
            />
            <button
              type="submit"
              className="rounded bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              data-testid="product-search-submit"
            >
              搜尋
            </button>
          </div>
        </form>

        {categories.length > 0 ? (
          <nav
            className="mt-5 flex flex-wrap gap-3 rounded-lg border border-line bg-white p-4 shadow-sm"
            aria-label="商品分類篩選"
            data-testid="product-category-filter"
          >
            <CategoryLink
              href={buildProductsHref({ keyword })}
              label="全部商品"
              count={products.length}
              active={!selectedCategorySlug}
            />
            {categories.map((category) => (
              <CategoryLink
                key={category.id}
                href={buildProductsHref({ categorySlug: category.slug, keyword })}
                label={category.name}
                count={category._count.products}
                active={selectedCategorySlug === category.slug}
              />
            ))}
          </nav>
        ) : null}

        <div className="mt-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            共 {filteredProducts.length} 件商品
            {selectedCategory ? `，目前分類：${selectedCategory.name}` : ""}
            {keyword ? `，搜尋：${keyword}` : ""}
          </p>
          {selectedCategory || keyword ? (
            <div className="flex flex-wrap gap-3">
              {selectedCategory ? (
                <Link
                  href={buildProductsHref({ keyword })}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  清除分類
                </Link>
              ) : null}
              {keyword ? (
                <Link
                  href={buildProductsHref({ categorySlug: selectedCategorySlug })}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  清除搜尋
                </Link>
              ) : null}
              <Link href="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                清除全部
              </Link>
            </div>
          ) : null}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-list">
            {filteredProducts.map((product: PublishedProduct) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-ink">找不到符合條件的商品</h2>
            <p className="mt-2 text-sm text-muted">
              可以調整關鍵字、切換分類，或回到全部商品重新瀏覽。
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
            >
              查看全部商品
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function CategoryLink({
  href,
  label,
  count,
  active
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-line bg-white text-ink hover:border-brand-500"
      }`}
      data-testid="product-category-link"
    >
      {label}
      <span className={active ? "ml-2 text-white/80" : "ml-2 text-muted"}>{count}</span>
    </Link>
  );
}

function matchesFilters(
  product: PublishedProduct,
  filters: {
    categorySlug: string;
    keyword: string;
  }
) {
  const categoryMatched =
    !filters.categorySlug || product.category?.slug === filters.categorySlug;

  if (!categoryMatched) {
    return false;
  }

  const keyword = filters.keyword.toLowerCase();

  if (!keyword) {
    return true;
  }

  return [
    product.name,
    product.sku,
    product.slug,
    product.shortDescription,
    product.description,
    product.category?.name ?? "",
    product.category?.slug ?? ""
  ]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

function buildProductsHref({
  categorySlug,
  keyword
}: {
  categorySlug?: string;
  keyword?: string;
}) {
  const params = new URLSearchParams();

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  if (keyword) {
    params.set("q", keyword);
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function getProductsSafely() {
  try {
    return await getPublishedProducts();
  } catch {
    return [];
  }
}

async function getCategoriesSafely() {
  try {
    return await getPublishedProductCategories();
  } catch {
    return [];
  }
}
