import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/(protected)/products/actions";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminSession } from "@/lib/rbac";
import {
  getAdminCategories,
  getAdminMerchants,
  getAdminProductById
} from "@/modules/catalog/product.repository";
import { getAdminMedia } from "@/modules/media/media.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "編輯商品"
};

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const session = await requireAdminSession();
  const [product, merchants, categories, media] = await Promise.all([
    getAdminProductById(id, session),
    getAdminMerchants(session),
    getAdminCategories(session),
    getAdminMedia(session)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-semibold text-brand-700">
          返回商品列表
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink">編輯商品</h2>
      </div>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        product={product}
        merchants={merchants}
        categories={categories}
        media={media}
        submitLabel="儲存變更"
      />
    </div>
  );
}
