import Link from "next/link";
import type { Metadata } from "next";
import { createPageAction } from "@/app/admin/(protected)/pages/actions";
import { PageForm } from "@/components/admin/page-form";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminMedia } from "@/modules/media/media.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新增頁面"
};

export default async function NewPagePage() {
  const session = await requireAdminSession();
  const [merchants, media] = await Promise.all([
    getAdminMerchants(session),
    getAdminMedia(session)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="text-sm font-semibold text-brand-700">
          返回頁面列表
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink">新增頁面</h2>
      </div>
      <PageForm
        action={createPageAction}
        merchants={merchants}
        media={media}
        submitLabel="建立頁面"
      />
    </div>
  );
}
