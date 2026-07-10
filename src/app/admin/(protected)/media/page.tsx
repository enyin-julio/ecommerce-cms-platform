import type { Metadata } from "next";
import { uploadMediaAction } from "@/app/admin/(protected)/media/actions";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminMedia } from "@/modules/media/media.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "媒體庫"
};

export default async function AdminMediaPage() {
  const session = await requireAdminSession();
  const [merchants, media] = await Promise.all([
    getAdminMerchants(session),
    getAdminMedia(session)
  ]);

  return (
    <div className="space-y-6" data-testid="admin-media-page">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Media
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink">媒體庫</h2>
        <p className="mt-2 text-sm text-muted">
          上傳商品與 CMS Hero 圖片。本機開發會存到 public/uploads，production 可切換為 Vercel Blob。
        </p>
      </section>

      <form
        action={uploadMediaAction}
        className="grid gap-4 rounded-lg border border-line bg-white p-6 shadow-sm md:grid-cols-2"
        data-testid="admin-media-upload-form"
      >
        <label className="block">
          <span className="text-sm font-medium text-ink">商家</span>
          <select
            name="merchantId"
            defaultValue={merchants[0]?.id || ""}
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-media-merchantId"
          >
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">替代文字</span>
          <input
            name="altText"
            placeholder="例如：夏季新品形象照"
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-media-altText"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-ink">圖片檔案</span>
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            data-testid="admin-media-file"
          />
          <span className="mt-2 block text-xs text-muted">
            支援 JPG、PNG、WebP，單檔上限 5MB。
          </span>
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="admin-media-submit"
          >
            上傳圖片
          </button>
        </div>
      </form>

      {media.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-line bg-white shadow-sm"
              data-testid="admin-media-row"
            >
              <div
                className="aspect-[4/3] bg-slate-100 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${item.url})`
                }}
              />
              <div className="space-y-2 p-4 text-sm">
                <p className="font-semibold text-ink">{item.altText || "未命名圖片"}</p>
                <p className="break-all text-muted">{item.url}</p>
                <p className="text-muted">商家：{item.merchant.name}</p>
                <p className="text-muted">儲存：{item.provider}</p>
                {item.fileName ? <p className="break-all text-muted">檔名：{item.fileName}</p> : null}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted">
          目前尚未上傳媒體檔案。
        </section>
      )}
    </div>
  );
}
