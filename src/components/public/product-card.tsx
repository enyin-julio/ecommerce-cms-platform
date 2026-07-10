import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { productImagePlaceholder } from "@/lib/placeholders";

type ProductCardProps = {
  product: {
    name: string;
    slug: string;
    shortDescription: string;
    price: { toString(): string };
    originalPrice?: { toString(): string } | null;
    imageUrl?: string | null;
    category?: {
      name: string;
    } | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-lg border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
      data-testid="product-card"
    >
      <div
        className="aspect-[4/3] bg-cover bg-center"
        style={{
          backgroundImage: `url(${product.imageUrl || productImagePlaceholder})`
        }}
      />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {product.category?.name || "未分類"}
          </p>
          {product.originalPrice ? (
            <p className="text-sm text-muted line-through">
              {formatCurrency(product.originalPrice.toString())}
            </p>
          ) : null}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink group-hover:text-brand-700">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {product.shortDescription}
          </p>
        </div>
        <p className="text-xl font-bold text-ink">
          {formatCurrency(product.price.toString())}
        </p>
      </div>
    </Link>
  );
}
