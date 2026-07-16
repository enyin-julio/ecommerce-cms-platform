import type { Metadata } from "next";
import { applyThemeAction } from "@/app/admin/(protected)/themes/actions";
import { requireAdminSession } from "@/lib/rbac";
import {
  getThemePresetById,
  getThemePresetsByLayout,
  type ThemeLayout
} from "@/lib/theme-presets";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminSiteSetting } from "@/modules/settings/site-setting.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "主題管理"
};

type AdminThemesPageProps = {
  searchParams: Promise<{
    merchantId?: string;
    saved?: string;
  }>;
};

const layoutLabels: Record<ThemeLayout, string> = {
  "one-page": "一頁式網站",
  "multi-page": "多頁式網站"
};

export default async function AdminThemesPage({ searchParams }: AdminThemesPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession();
  const merchants = await getAdminMerchants(session);
  const selectedMerchant =
    merchants.find((merchant) => merchant.id === params.merchantId) || merchants[0] || null;
  const setting = selectedMerchant
    ? await getAdminSiteSetting(selectedMerchant.id, session)
    : null;
  const activeTheme = getThemePresetById(setting?.themePreset);

  if (!selectedMerchant) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-ink">主題管理</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          目前沒有可管理的商家。請先建立商家，再回來選擇網站主題。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-themes-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 主題管理 / 選擇主題
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">選擇您喜歡的主題</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            套用主題後，前台主色與重點按鈕會跟著更新。之後仍可隨時更換其他主題。
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
        >
          預覽前台
        </a>
      </section>

      {params.saved ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          主題已套用。
        </div>
      ) : null}

      {merchants.length > 1 ? (
        <form action="/admin/themes" className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <label className="block max-w-xl">
            <span className="text-sm font-semibold text-ink">選擇商家</span>
            <select
              name="merchantId"
              defaultValue={selectedMerchant.id}
              className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
              data-testid="admin-themes-merchant-switcher"
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

      <section key={selectedMerchant.id} className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-muted">目前使用的主題</p>
        <div className="mt-4 flex flex-col justify-between gap-4 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xl font-bold text-ink">{activeTheme.name}</p>
            <p className="mt-2 text-sm text-muted">{layoutLabels[activeTheme.layout]}</p>
          </div>
          <ThemeSwatches
            primaryColor={activeTheme.primaryColor}
            softColor={activeTheme.softColor}
            accentColor={activeTheme.accentColor}
          />
        </div>
      </section>

      {(["one-page", "multi-page"] as ThemeLayout[]).map((layout) => (
        <section key={layout} className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-ink">{layoutLabels[layout]}</h3>
            <p className="mt-2 text-sm text-muted">
              {layout === "one-page"
                ? "適合單一活動、品牌介紹或快速展示重點。"
                : "適合商品、內容頁、服務頁與購物流程較完整的網站。"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {getThemePresetsByLayout(layout).map((theme) => {
              const isActive = activeTheme.id === theme.id;

              return (
                <article
                  key={theme.id}
                  className="overflow-hidden rounded-lg border border-line bg-white shadow-sm"
                >
                  <div
                    className="h-28"
                    style={{
                      background: `linear-gradient(135deg, ${theme.softColor}, #ffffff 52%, ${theme.primaryColor})`
                    }}
                  />
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-ink">{theme.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-muted">{theme.description}</p>
                      </div>
                      <ThemeSwatches
                        primaryColor={theme.primaryColor}
                        softColor={theme.softColor}
                        accentColor={theme.accentColor}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <form action={applyThemeAction}>
                        <input type="hidden" name="merchantId" value={selectedMerchant.id} />
                        <input type="hidden" name="themePreset" value={theme.id} />
                        <button
                          type="submit"
                          disabled={isActive}
                          className={
                            isActive
                              ? "rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700"
                              : "rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                          }
                        >
                          {isActive ? "已套用此主題" : "套用"}
                        </button>
                      </form>
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
                      >
                        預覽
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ThemeSwatches({
  primaryColor,
  softColor,
  accentColor
}: {
  primaryColor: string;
  softColor: string;
  accentColor: string;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border border-line">
      {[primaryColor, softColor, accentColor].map((color) => (
        <span key={color} className="h-8 w-8" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
