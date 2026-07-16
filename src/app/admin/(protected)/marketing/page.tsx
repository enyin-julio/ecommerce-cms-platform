import type { Metadata } from "next";
import { updateMarketingSettingAction } from "@/app/admin/(protected)/marketing/actions";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminSiteSetting } from "@/modules/settings/site-setting.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "行銷管理"
};

type AdminMarketingPageProps = {
  searchParams: Promise<{
    merchantId?: string;
    saved?: string;
  }>;
};

export default async function AdminMarketingPage({ searchParams }: AdminMarketingPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession();
  const merchants = await getAdminMerchants(session);
  const selectedMerchant =
    merchants.find((merchant) => merchant.id === params.merchantId) || merchants[0] || null;
  const setting = selectedMerchant
    ? await getAdminSiteSetting(selectedMerchant.id, session)
    : null;

  if (!selectedMerchant) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-ink">行銷管理</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          目前沒有可管理的商家。請先建立商家，再回來設定行銷工具。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-marketing-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 行銷管理 / 行銷工具
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">行銷管理</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            管理搜尋收錄、廣告像素與流量分析工具。填入 ID 後，前台會自動輸出必要追蹤碼。
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
          行銷工具設定已儲存。
        </div>
      ) : null}

      {merchants.length > 1 ? (
        <form action="/admin/marketing" className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <label className="block max-w-xl">
            <span className="text-sm font-semibold text-ink">選擇商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchant.id}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-marketing-merchant-switcher"
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

      <form
        key={selectedMerchant.id}
        action={updateMarketingSettingAction}
        className="space-y-5 rounded-lg border border-line bg-white p-6 shadow-sm"
        data-testid="admin-marketing-form"
      >
        <input type="hidden" name="merchantId" value={selectedMerchant.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <MarketingToolCard
            title="Google 搜尋引擎收錄"
            description="貼上 Google Search Console HTML 標記的 content 驗證碼。"
          >
            <TextField
              label="Google Search Console 驗證碼"
              name="googleSearchConsoleVerification"
              defaultValue={setting?.googleSearchConsoleVerification || ""}
              placeholder="例如：abc123-google-verification-code"
            />
          </MarketingToolCard>

          <MarketingToolCard
            title="Google 代碼管理工具"
            description="填入 GTM 容器 ID，前台會自動安裝 Google Tag Manager。"
          >
            <TextField
              label="GTM Container ID"
              name="googleTagManagerId"
              defaultValue={setting?.googleTagManagerId || ""}
              placeholder="例如：GTM-XXXXXXX"
            />
          </MarketingToolCard>

          <MarketingToolCard
            title="Meta 像素（原 Facebook 像素）"
            description="填入 Meta Pixel ID，前台會自動安裝基礎 PageView 追蹤。"
          >
            <TextField
              label="Meta Pixel ID"
              name="metaPixelId"
              defaultValue={setting?.metaPixelId || ""}
              placeholder="例如：123456789012345"
            />
          </MarketingToolCard>

          <MarketingToolCard
            title="Google Analytics 4"
            description="填入 GA4 Measurement ID，前台會自動安裝 gtag。"
          >
            <TextField
              label="GA4 Measurement ID"
              name="googleAnalyticsMeasurementId"
              defaultValue={setting?.googleAnalyticsMeasurementId || ""}
              placeholder="例如：G-XXXXXXXXXX"
            />
          </MarketingToolCard>

          <MarketingToolCard
            title="Facebook 商業擴充功能（FBE）+ 轉換 API"
            description="轉換 API 需要 server access token，不能放在前台。這裡先記錄人工設定狀態，正式串接時會放到安全環境變數。"
            className="md:col-span-2"
          >
            <label className="block">
              <span className="text-sm font-semibold text-ink">設定備註</span>
              <textarea
                name="facebookBusinessExtensionNote"
                defaultValue={setting?.facebookBusinessExtensionNote || ""}
                placeholder="例如：Meta Business 已連接、CAPI token 尚未建立、等待正式廣告帳號審核。"
                rows={4}
                className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
                data-testid="admin-marketing-facebookBusinessExtensionNote"
              />
            </label>
          </MarketingToolCard>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">儲存後，前台會套用最新行銷追蹤設定。</p>
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="admin-marketing-submit"
          >
            儲存行銷設定
          </button>
        </div>
      </form>
    </div>
  );
}

function MarketingToolCard({
  title,
  description,
  children,
  className = ""
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-slate-50 p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
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
        data-testid={`admin-marketing-${name}`}
        {...props}
      />
    </label>
  );
}
