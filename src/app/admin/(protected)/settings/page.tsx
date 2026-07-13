import type { Metadata } from "next";
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
    <div className="space-y-6" data-testid="admin-settings-page">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          網站設定
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink">基本網站資料</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          設定站名、Logo、品牌主色與 SEO 資訊。這些資料會作為前台網站與搜尋摘要的基礎設定。
        </p>
      </section>

      {params.saved ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          網站設定已儲存。
        </div>
      ) : null}

      {merchants.length > 1 ? (
        <form className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <label className="block max-w-xl">
            <span className="text-sm font-medium text-ink">選擇商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchant.id}
              className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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
            className="mt-4 rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-brand-500"
          >
            切換商家
          </button>
        </form>
      ) : null}

      <form
        action={updateSiteSettingAction}
        className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
        data-testid="admin-settings-form"
      >
        <input type="hidden" name="merchantId" value={selectedMerchant.id} />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="網站名稱"
            name="siteName"
            defaultValue={setting?.siteName || selectedMerchant.name}
            required
          />
          <TextField
            label="品牌主色"
            name="primaryColor"
            type="color"
            defaultValue={setting?.primaryColor || "#2563eb"}
            required
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink">Logo 圖片 URL</span>
          <input
            name="logoUrl"
            list="site-logo-media-urls"
            defaultValue={setting?.logoUrl || ""}
            placeholder="可貼上圖片網址，或從媒體庫選擇 Logo 圖片"
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            data-testid="admin-settings-logoUrl"
          />
          <span className="mt-2 block text-xs text-muted">
            可先到媒體庫上傳 Logo，再回到這裡選擇圖片網址。
          </span>
        </label>
        <datalist id="site-logo-media-urls">
          {logoMedia.map((item) => (
            <option key={item.id} value={item.url}>
              {item.altText || item.fileName || item.url}
            </option>
          ))}
        </datalist>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="SEO 標題"
            name="seoTitle"
            defaultValue={setting?.seoTitle || ""}
            placeholder="例如：AIH 品牌商城"
          />
          <TextField
            label="SEO 描述"
            name="seoDescription"
            defaultValue={setting?.seoDescription || ""}
            placeholder="簡短描述網站內容，建議 80 到 160 字"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="admin-settings-submit"
          >
            儲存設定
          </button>
        </div>
      </form>
    </div>
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
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
        data-testid={`admin-settings-${name}`}
        {...props}
      />
    </label>
  );
}
