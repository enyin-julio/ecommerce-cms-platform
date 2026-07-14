import Image from "next/image";
import type { Metadata } from "next";
import { MediaImageField } from "@/components/admin/media-image-field";
import { updateSiteSettingAction } from "@/app/admin/(protected)/settings/actions";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminMedia } from "@/modules/media/media.repository";
import { getAdminSiteSetting } from "@/modules/settings/site-setting.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "網站設定"
};

type AdminSettingsPageProps = {
  searchParams: Promise<{
    merchantId?: string;
    saved?: string;
  }>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession();
  const [merchants, media] = await Promise.all([
    getAdminMerchants(session),
    getAdminMedia(session)
  ]);
  const selectedMerchant =
    merchants.find((merchant) => merchant.id === params.merchantId) || merchants[0] || null;
  const setting = selectedMerchant
    ? await getAdminSiteSetting(selectedMerchant.id, session)
    : null;
  const logoMedia = media.filter((item) => {
    return selectedMerchant ? item.merchantId === selectedMerchant.id : true;
  });
  const logoMediaOptions = logoMedia.map((item) => ({
    id: item.id,
    url: item.url,
    altText: item.altText,
    fileName: item.fileName,
    merchantName: item.merchant.name
  }));
  const siteName = setting?.siteName || selectedMerchant?.name || "";
  const logoUrl = setting?.logoUrl || "";
  const primaryColor = setting?.primaryColor || "#2563eb";

  if (!selectedMerchant) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-ink">網站設定</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          目前沒有可設定的商家。請先建立商家資料後再回來設定網站。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-settings-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 網站設定 / 品牌設定
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">網站設定</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            設定站名、Logo、品牌主色與 SEO 資訊。儲存後會同步影響前台首頁、導覽列與搜尋摘要。
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
        >
          查看前台
        </a>
      </section>

      {params.saved ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          網站設定已儲存，前台會使用最新設定。
        </div>
      ) : null}

      {merchants.length > 1 ? (
        <form className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <label className="block max-w-xl">
            <span className="text-sm font-semibold text-ink">選擇商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchant.id}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-settings-merchant-switcher"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-4 rounded bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            切換商家
          </button>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          action={updateSiteSettingAction}
          className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
          data-testid="admin-settings-form"
        >
          <input type="hidden" name="merchantId" value={selectedMerchant.id} />

          <SettingsSection
            title="基本資料"
            description="這些資料會顯示在前台導覽列、首頁與瀏覽器搜尋結果。"
          >
            <TextField
              label="網站名稱"
              name="siteName"
              defaultValue={siteName}
              placeholder="例如：AIH 品牌商城"
              required
            />
            <TextField
              label="SEO 標題"
              name="seoTitle"
              defaultValue={setting?.seoTitle || ""}
              placeholder="例如：AIH 智慧生活品牌商城"
            />
            <label className="block">
              <span className="text-sm font-semibold text-ink">SEO 描述</span>
              <textarea
                name="seoDescription"
                defaultValue={setting?.seoDescription || ""}
                placeholder="簡短描述網站內容，建議 80 到 160 字。"
                rows={4}
                className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
                data-testid="admin-settings-seoDescription"
              />
            </label>
          </SettingsSection>

          <SettingsSection
            title="品牌外觀"
            description="可從媒體庫選擇 Logo，也可以手動貼上外部圖片網址。"
          >
            <TextField
              label="品牌主色"
              name="primaryColor"
              type="color"
              defaultValue={primaryColor}
              required
            />

            <MediaImageField
              name="logoUrl"
              label="Logo 圖片 URL"
              defaultValue={logoUrl}
              media={logoMediaOptions}
              testId="admin-settings-logoUrl"
              helpText="Logo 會顯示在前台導覽列，建議使用透明背景 PNG 或 WebP。"
            />
          </SettingsSection>

          <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">儲存後會重新整理前台首頁、商品頁與品牌頁快取。</p>
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              data-testid="admin-settings-submit"
            >
              儲存設定
            </button>
          </div>
        </form>

        <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted">前台預覽</p>
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${siteName} Logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded object-contain"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded text-sm font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {siteName.slice(0, 1) || "站"}
                </div>
              )}
              <div>
                <p className="font-bold text-ink">{siteName}</p>
                <p className="mt-1 text-xs text-muted">導覽列與首頁會使用這個名稱。</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-white p-4">
              <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                品牌電商 CMS
              </p>
              <p className="mt-2 text-xl font-bold text-ink">{siteName}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                {setting?.seoDescription ||
                  "SEO 描述會顯示在首頁摘要與搜尋結果中，建議用一句話說清楚品牌定位。"}
              </p>
              <div
                className="mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                主要按鈕顏色
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-line pb-6 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={`admin-settings-${name}`}
        {...props}
      />
    </label>
  );
}
