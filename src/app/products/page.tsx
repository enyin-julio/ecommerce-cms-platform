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
  const [products, categories] = await Promise.all([
    getProductsSafely(),
    getCategoriesSafely()
  ]);
  const filteredProducts = selectedCategorySlug
    ? products.filter((product) => product.category?.slug === selectedCategorySlug)
    : products;
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug);

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
            這裡只會顯示已上架商品。可依商品分類快速篩選，找到適合的品牌商品。
          </p>
        </div>

        {categories.length > 0 ? (
          <nav
            className="mt-8 flex flex-wrap gap-3 rounded-lg border border-line bg-white p-4 shadow-sm"
            aria-label="商品分類篩選"
            data-testid="product-category-filter"
          >
            <CategoryLink
              href="/products"
              label="全部商品"
              count={products.length}
              active={!selectedCategorySlug}
            />
            {categories.map((category) => (
              <CategoryLink
                key={category.id}
                href={`/products?category=${category.slug}`}
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
          </p>
          {selectedCategory ? (
            <Link href="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              清除分類篩選
            </Link>
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
            <h2 className="text-lg font-semibold text-ink">
              {selectedCategory ? "此分類目前沒有上架商品" : "目前沒有上架商品"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              請到後台新增商品，確認圖片、價格與庫存後再上架。
            </p>
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
