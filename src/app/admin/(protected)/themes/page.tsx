import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  applyThemeAction,
  updateThemeStyleAction
} from "@/app/admin/(protected)/themes/actions";
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
    tab?: string;
  }>;
};

type ThemeTab = "choose" | "edit";

const layoutLabels: Record<ThemeLayout, string> = {
  "one-page": "單頁式品牌頁",
  "multi-page": "多頁式品牌商城"
};

const headerStyles = [
  { value: "header-1", title: "樣式 1：標準導覽", description: "Logo 在左、選單在右，最適合一般品牌商城。" },
  { value: "header-2", title: "樣式 2：置中品牌", description: "品牌名稱更明顯，適合形象官網。" },
  { value: "header-3", title: "樣式 3：大型品牌列", description: "頁首高度較高，適合強化品牌第一印象。" },
  { value: "header-4", title: "樣式 4：精簡工具列", description: "導覽較輕量，適合商品頁或活動頁。" }
];

const footerStyles = [
  { value: "footer-1", title: "樣式 1：標準頁尾", description: "顯示品牌名稱與商店政策連結。" },
  { value: "footer-2", title: "樣式 2：分欄資訊", description: "適合內容較多、政策或服務入口較多的網站。" },
  { value: "footer-3", title: "樣式 3：精簡頁尾", description: "只保留品牌與重要連結，畫面乾淨。" },
  { value: "footer-4", title: "樣式 4：品牌故事頁尾", description: "頁尾呈現較明顯的品牌說明與行動入口。" }
];

const fontOptions = [
  { value: "noto-sans-tc", title: "思源黑體風格", description: "清楚、穩定，適合大多數台灣品牌。" },
  { value: "system", title: "系統預設字型", description: "載入最快，視覺中性。" },
  { value: "serif", title: "襯線字型", description: "較有書冊感，適合內容與品牌故事。" },
  { value: "rounded", title: "圓體風格", description: "較親切柔和，適合生活、親子與服務型品牌。" }
];

const headingScaleOptions = [
  { value: "compact", title: "精簡", description: "標題較收斂，適合資訊密度高的頁面。" },
  { value: "default", title: "標準", description: "目前建議值，品牌與商品頁都好讀。" },
  { value: "large", title: "醒目", description: "標題較大，適合形象頁與活動頁。" }
];

const navigationStyles = [
  { value: "standard", title: "標準選單", description: "品牌介紹、商品、購物車與會員入口並列。" },
  { value: "centered", title: "置中選單", description: "選單更像形象官網，視覺較平衡。" },
  { value: "compact", title: "精簡選單", description: "保留主要入口，適合手機與商品導向網站。" }
];

export default async function AdminThemesPage({ searchParams }: AdminThemesPageProps) {
  const params = await searchParams;
  const activeTab: ThemeTab = params.tab === "edit" ? "edit" : "choose";
  const session = await requireAdminSession();
  const merchants = await getAdminMerchants(session);
  const selectedMerchant =
    merchants.find((merchant) => merchant.id === params.merchantId) || merchants[0] || null;
  const setting = selectedMerchant
    ? await getAdminSiteSetting(selectedMerchant.id, session)
    : null;
  const activeTheme = getThemePresetById(setting?.themePreset);
  const primaryColor = setting?.primaryColor || activeTheme.primaryColor;

  if (!selectedMerchant) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-ink">主題管理</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          目前沒有可管理的商家。請先建立商家，再設定網站主題。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-themes-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            網站設計 / 主題管理
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">主題管理</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            先選擇整體網站主題，再調整頁首、頁尾、配色、字型與選單樣式。
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
          {params.saved === "style" ? "主題樣式已儲存。" : "主題已套用。"}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          {merchants.length > 1 ? (
            <form action="/admin/themes" className="grid gap-3 sm:grid-cols-[minmax(0,360px)_auto] sm:items-end">
              <input type="hidden" name="tab" value={activeTab} />
              <label>
                <span className="text-sm font-semibold text-ink">切換商家</span>
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
                className="rounded bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                切換
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm font-semibold text-ink">目前商家</p>
              <p className="mt-2 text-lg font-bold text-ink">{selectedMerchant.name}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <TabLink active={activeTab === "choose"} href={`/admin/themes?merchantId=${selectedMerchant.id}&tab=choose`}>
              選擇主題
            </TabLink>
            <TabLink active={activeTab === "edit"} href={`/admin/themes?merchantId=${selectedMerchant.id}&tab=edit`}>
              編輯主題
            </TabLink>
          </div>
        </div>
      </section>

      <section key={`${selectedMerchant.id}-${activeTab}`} className="space-y-6">
        <CurrentThemeCard
          activeThemeName={activeTheme.name}
          layoutLabel={layoutLabels[activeTheme.layout]}
          primaryColor={primaryColor}
          softColor={activeTheme.softColor}
          accentColor={activeTheme.accentColor}
        />

        {activeTab === "choose" ? (
          <ChooseThemeSection
            merchantId={selectedMerchant.id}
            activeThemeId={activeTheme.id}
          />
        ) : (
          <EditThemeSection
            merchantId={selectedMerchant.id}
            primaryColor={primaryColor}
            headerStyle={setting?.themeHeaderStyle || "header-1"}
            footerStyle={setting?.themeFooterStyle || "footer-1"}
            fontFamily={setting?.themeFontFamily || "noto-sans-tc"}
            headingScale={setting?.themeHeadingScale || "default"}
            navigationStyle={setting?.themeNavigationStyle || "standard"}
          />
        )}
      </section>
    </div>
  );
}

function CurrentThemeCard({
  activeThemeName,
  layoutLabel,
  primaryColor,
  softColor,
  accentColor
}: {
  activeThemeName: string;
  layoutLabel: string;
  primaryColor: string;
  softColor: string;
  accentColor: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-muted">目前套用主題</p>
      <div className="mt-4 flex flex-col justify-between gap-4 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xl font-bold text-ink">{activeThemeName}</p>
          <p className="mt-2 text-sm text-muted">{layoutLabel}</p>
        </div>
        <ThemeSwatches
          primaryColor={primaryColor}
          softColor={softColor}
          accentColor={accentColor}
        />
      </div>
    </section>
  );
}

function ChooseThemeSection({
  merchantId,
  activeThemeId
}: {
  merchantId: string;
  activeThemeId: string;
}) {
  return (
    <div className="space-y-8">
      {(["one-page", "multi-page"] as ThemeLayout[]).map((layout) => (
        <section key={layout} className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-ink">{layoutLabels[layout]}</h3>
            <p className="mt-2 text-sm text-muted">
              {layout === "one-page"
                ? "適合品牌形象、活動頁、服務介紹等單一重點頁面。"
                : "適合正式商城，商品、內容、購物車與會員入口分開管理。"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {getThemePresetsByLayout(layout).map((theme) => {
              const isActive = activeThemeId === theme.id;

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
                        <input type="hidden" name="merchantId" value={merchantId} />
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

function EditThemeSection({
  merchantId,
  primaryColor,
  headerStyle,
  footerStyle,
  fontFamily,
  headingScale,
  navigationStyle
}: {
  merchantId: string;
  primaryColor: string;
  headerStyle: string;
  footerStyle: string;
  fontFamily: string;
  headingScale: string;
  navigationStyle: string;
}) {
  return (
    <form
      action={updateThemeStyleAction}
      className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
      data-testid="admin-theme-style-form"
    >
      <input type="hidden" name="merchantId" value={merchantId} />

      <ThemeEditorGroup
        title="頁首及頁尾"
        description="調整網站最上方導覽列與最下方頁尾的呈現方式。"
      >
        <OptionGrid
          name="themeHeaderStyle"
          label="頁首樣式"
          options={headerStyles}
          defaultValue={headerStyle}
        />
        <OptionGrid
          name="themeFooterStyle"
          label="頁尾樣式"
          options={footerStyles}
          defaultValue={footerStyle}
        />
      </ThemeEditorGroup>

      <ThemeEditorGroup
        title="配色及字型"
        description="設定品牌主色、全站字型與標題大小。"
      >
        <label className="block">
          <span className="text-sm font-semibold text-ink">品牌主色</span>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="color"
              name="primaryColor"
              defaultValue={primaryColor}
              className="h-12 w-24 rounded border border-line bg-white p-1"
            />
            <span className="text-sm text-muted">{primaryColor}</span>
          </div>
        </label>
        <OptionGrid
          name="themeFontFamily"
          label="字型"
          options={fontOptions}
          defaultValue={fontFamily}
        />
        <OptionGrid
          name="themeHeadingScale"
          label="標題大小"
          options={headingScaleOptions}
          defaultValue={headingScale}
        />
      </ThemeEditorGroup>

      <ThemeEditorGroup
        title="選單及頁面"
        description="設定前台導覽列的排列方式，後續可再接更多頁面版型。"
      >
        <OptionGrid
          name="themeNavigationStyle"
          label="選單樣式"
          options={navigationStyles}
          defaultValue={navigationStyle}
        />
      </ThemeEditorGroup>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">儲存後會更新前台主色、字型與導覽呈現。</p>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          儲存主題設定
        </button>
      </div>
    </form>
  );
}

function TabLink({
  active,
  href,
  children
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded bg-ink px-5 py-3 text-sm font-semibold text-white"
          : "rounded border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
      }
    >
      {children}
    </Link>
  );
}

function ThemeEditorGroup({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 border-b border-line pb-6 last:border-b-0">
      <div>
        <h3 className="text-2xl font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function OptionGrid({
  name,
  label,
  options,
  defaultValue
}: {
  name: string;
  label: string;
  options: Array<{ value: string; title: string; description: string }>;
  defaultValue: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-lg border border-line bg-white p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              className="sr-only"
            />
            <span className="block text-sm font-bold text-ink">{option.title}</span>
            <span className="mt-2 block text-xs leading-5 text-muted">{option.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
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
