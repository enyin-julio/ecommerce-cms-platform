import Link from "next/link";
import type { Metadata } from "next";
import { updateStorePolicyAction } from "@/app/admin/(protected)/policies/actions";
import { requireAdminSession } from "@/lib/rbac";
import {
  getStorePolicyDefinitionBySlug,
  storePolicyDefinitions
} from "@/lib/store-policy-types";
import { getAdminMerchants } from "@/modules/catalog/product.repository";
import { getAdminStorePolicy } from "@/modules/settings/store-policy.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商店政策"
};

type AdminPoliciesPageProps = {
  searchParams: Promise<{
    merchantId?: string;
    tab?: string;
    saved?: string;
  }>;
};

export default async function AdminPoliciesPage({ searchParams }: AdminPoliciesPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession();
  const merchants = await getAdminMerchants(session);
  const selectedMerchant =
    merchants.find((merchant) => merchant.id === params.merchantId) || merchants[0] || null;
  const policy = selectedMerchant
    ? await getAdminStorePolicy(selectedMerchant.id, session)
    : null;
  const activePolicy =
    getStorePolicyDefinitionBySlug(params.tab || "") || storePolicyDefinitions[0];
  const activeContent = policy?.[activePolicy.key] || "";

  if (!selectedMerchant) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-ink">商店政策</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          目前沒有可管理的商家。請先建立商家，再回來編輯商店政策。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-policies-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            總覽 / 商店管理 / 商店政策
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">商店政策</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            下方欄位有資料時，其內容會顯示於前台商店政策頁，方便消費者查看交易與服務規範。
          </p>
        </div>
        <Link
          href={`/policies/${activePolicy.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
        >
          預覽前台政策頁
        </Link>
      </section>

      {params.saved ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          商店政策已儲存。
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
              data-testid="admin-policies-merchant-switcher"
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

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="flex gap-3 overflow-x-auto bg-slate-50 p-5">
          {storePolicyDefinitions.map((item) => {
            const isActive = item.key === activePolicy.key;

            return (
              <Link
                key={item.key}
                href={`/admin/policies?merchantId=${selectedMerchant.id}&tab=${item.slug}`}
                className={
                  isActive
                    ? "whitespace-nowrap rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                    : "whitespace-nowrap rounded border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
                }
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        <form action={updateStorePolicyAction} className="space-y-5 p-6">
          <input type="hidden" name="merchantId" value={selectedMerchant.id} />
          <input type="hidden" name="policyKey" value={activePolicy.key} />

          <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-start">
            <div>
              <h3 className="text-2xl font-bold text-ink">{activePolicy.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{activePolicy.description}</p>
            </div>
            <Link
              href={`/policies/${activePolicy.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-white px-5 py-2 text-center text-sm font-semibold text-ink hover:border-brand-500"
            >
              預覽
            </Link>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">{activePolicy.title}內容</span>
            <textarea
              name="content"
              defaultValue={activeContent}
              rows={16}
              className="mt-3 w-full rounded border border-line px-4 py-3 text-sm leading-7 outline-none focus:border-brand-500"
              placeholder={`請輸入${activePolicy.title}，可直接貼上段落文字，系統會保留換行。`}
              data-testid={`admin-policy-content-${activePolicy.slug}`}
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">前台網址：/policies/{activePolicy.slug}</p>
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              data-testid={`admin-policy-submit-${activePolicy.slug}`}
            >
              儲存{activePolicy.title}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
