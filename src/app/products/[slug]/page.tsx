import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addToCartAction } from "@/app/cart/actions";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { productImagePlaceholder } from "@/lib/placeholders";
import { getPublishedProductBySlug } from "@/modules/catalog/product.repository";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductSafely(slug);

  if (!product) {
    return {
      title: "找不到商品"
    };
  }

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductSafely(slug);

  if (!product) {
    notFound();
  }

  const isSoldOut = product.stock < 1;
  const hasDiscount = product.originalPrice && product.originalPrice.greaterThan(product.price);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          返回商品列表
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div
              className="aspect-square bg-slate-100 bg-cover bg-center"
              style={{
                backgroundImage: `url("${product.imageUrl || productImagePlaceholder}")`
              }}
              aria-label={`${product.name} 商品圖片`}
            />
          </div>

          <div className="rounded-lg border border-line bg-white p-6 shadow-sm lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {product.category?.name || "未分類"}
              </span>
              <StockBadge stock={product.stock} />
            </div>

            <h1
              className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl"
              data-testid="product-detail-title"
            >
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">{product.shortDescription}</p>

            <div className="mt-6 rounded-lg bg-slate-50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-3xl font-bold text-ink">
                  {formatCurrency(product.price.toString())}
                </p>
                {product.originalPrice ? (
                  <p className="text-lg text-muted line-through">
                    {formatCurrency(product.originalPrice.toString())}
                  </p>
                ) : null}
                {hasDiscount ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    限時優惠
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-muted">SKU：{product.sku}</p>
            </div>

            <form action={addToCartAction} className="mt-6 space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <label className="block">
                <span className="text-sm font-semibold text-ink">購買數量</span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max={Math.max(1, product.stock)}
                  defaultValue="1"
                  disabled={isSoldOut}
                  className="mt-2 min-h-12 w-32 rounded border border-line px-4 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100"
                  data-testid="product-quantity"
                />
              </label>
              <button
                type="submit"
                disabled={isSoldOut}
                className="w-full rounded-full bg-brand-600 px-6 py-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                data-testid="add-to-cart"
              >
                {isSoldOut ? "已售完" : "加入購物車"}
              </button>
            </form>

            <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-3">
              <InfoBadge title="安全結帳" body="訂單金額由後端重新計算" />
              <InfoBadge title="庫存檢查" body="下單前確認商品可售" />
              <InfoBadge title="訂單查詢" body="會員可查詢歷史訂單" />
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">商品詳情</h2>
          <p className="mt-4 whitespace-pre-line leading-8 text-muted">{product.description}</p>
        </section>
      </section>
    </main>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock < 1) {
    return (
      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
        已售完
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        低庫存，剩 {stock} 件
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      現貨，庫存 {stock} 件
    </span>
  );
}

function InfoBadge({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5">{body}</p>
    </div>
  );
}

async function getProductSafely(slug: string) {
  try {
    return await getPublishedProductBySlug(slug);
  } catch {
    return null;
  }
}
