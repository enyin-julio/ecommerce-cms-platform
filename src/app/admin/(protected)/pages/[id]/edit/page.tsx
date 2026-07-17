import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updatePageAction } from "@/app/admin/(protected)/pages/actions";
import { PageForm } from "@/components/admin/page-form";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminPageById } from "@/modules/content/page.repository";
import { getAdminMedia } from "@/modules/media/media.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "編輯頁面"
};

type EditPagePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPagePage({ params }: EditPagePageProps) {
  const { id } = await params;
  const session = await requireAdminSession();
  const page = await getAdminPageById(id, session);

  if (!page) {
    notFound();
  }

  const [merchantsResult, mediaResult] = await Promise.allSettled([
    getAdminMerchants(session),
    getAdminMedia(session)
  ]);
  const merchants =
    merchantsResult.status === "fulfilled" && merchantsResult.value.length > 0
      ? merchantsResult.value
      : [page.merchant];
  const media = mediaResult.status === "fulfilled" ? mediaResult.value : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="text-sm font-semibold text-brand-700">
          返回頁面列表
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink">編輯頁面</h2>
        {mediaResult.status === "rejected" ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            媒體庫暫時無法載入，但仍可編輯頁面文字與設定。
          </p>
        ) : null}
      </div>
      <PageForm
        action={updatePageAction.bind(null, page.id)}
        page={page}
        merchants={merchants}
        media={media}
        submitLabel="儲存頁面"
      />
    </div>
  );
}
