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
      title: "Product not found"
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

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div
          className="aspect-square rounded-lg bg-slate-100 bg-cover bg-center"
          style={{
            backgroundImage: `url(${product.imageUrl || productImagePlaceholder})`
          }}
        />
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {product.category?.name || "Uncategorized"}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink" data-testid="product-detail-title">
            {product.name}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">{product.shortDescription}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-bold text-ink">
              {formatCurrency(product.price.toString())}
            </p>
            {product.originalPrice ? (
              <p className="text-lg text-muted line-through">
                {formatCurrency(product.originalPrice.toString())}
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-muted">Stock: {product.stock}</p>
          <form action={addToCartAction} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="productId" value={product.id} />
            <input
              name="quantity"
              type="number"
              min="1"
              max={Math.max(1, product.stock)}
              defaultValue="1"
              disabled={isSoldOut}
              className="w-full rounded-full border border-line px-5 py-3 text-sm outline-none focus:border-brand-500 sm:w-32"
              data-testid="product-quantity"
            />
            <button
              type="submit"
              disabled={isSoldOut}
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="add-to-cart"
            >
              {isSoldOut ? "Sold out" : "Add to cart"}
            </button>
          </form>
          <div className="mt-10 border-t border-line pt-8">
            <h2 className="text-lg font-semibold text-ink">Product details</h2>
            <p className="mt-3 whitespace-pre-line leading-8 text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getProductSafely(slug: string) {
  try {
    return await getPublishedProductBySlug(slug);
  } catch {
    return null;
  }
}
