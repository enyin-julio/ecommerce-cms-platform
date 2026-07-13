import type { Metadata } from "next";
import { ProductCard } from "@/components/public/product-card";
import { SiteHeader } from "@/components/public/site-header";
import { getPublishedProducts } from "@/modules/catalog/product.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品列表",
  description: "瀏覽 AIH 品牌商城目前已上架的商品。"
};

export default async function ProductsPage() {
  const products = await getProductsSafely();

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
              商品列表
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            這裡只會顯示已上架商品。若商品尚未完成圖片、庫存或描述，請先在後台保持下架狀態。
          </p>
        </div>

        {products.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-list">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-ink">目前沒有上架商品</h2>
            <p className="mt-2 text-sm text-muted">
              請到後台新增商品，確認圖片、價格與庫存後再上架。
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

async function getProductsSafely() {
  try {
    return await getPublishedProducts();
  } catch {
    return [];
  }
}
