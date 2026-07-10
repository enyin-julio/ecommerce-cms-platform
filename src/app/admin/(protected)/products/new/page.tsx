import Link from "next/link";
import type { Metadata } from "next";
import { createProductAction } from "@/app/admin/(protected)/products/actions";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminSession } from "@/lib/rbac";
import {
  getAdminCategories,
  getAdminMerchants
} from "@/modules/catalog/product.repository";
import { getAdminMedia } from "@/modules/media/media.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新增商品"
};

export default async function NewProductPage() {
  const session = await requireAdminSession();
  const [merchants, categories, media] = await Promise.all([
    getAdminMerchants(session),
    getAdminCategories(session),
    getAdminMedia(session)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-semibold text-brand-700">
          返回商品列表
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink">新增商品</h2>
      </div>
      <ProductForm
        action={createProductAction}
        merchants={merchants}
        categories={categories}
        media={media}
        submitLabel="建立商品"
      />
    </div>
  );
}
