import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { getStorePolicyDefinitionBySlug, storePolicyDefinitions } from "@/lib/store-policy-types";
import { getPublicStorePolicy } from "@/modules/settings/store-policy.repository";

export const dynamic = "force-dynamic";

type PolicyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policyDefinition = getStorePolicyDefinitionBySlug(slug);

  return {
    title: policyDefinition?.title || "商店政策",
    description: policyDefinition?.description || "查看商店服務、交易與隱私相關政策。"
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policyDefinition = getStorePolicyDefinitionBySlug(slug) || storePolicyDefinitions[0];
  const policy = await getPublicStorePolicySafely();
  const siteName = policy?.merchant.siteSetting?.siteName || policy?.merchant.name || "品牌商城";
  const content = policy?.[policyDefinition.key] || "";

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <article className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {siteName}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-ink">{policyDefinition.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{policyDefinition.description}</p>

          {content ? (
            <div className="mt-8 whitespace-pre-wrap text-sm leading-8 text-slate-700">
              {content}
            </div>
          ) : (
            <div className="mt-8 rounded-lg bg-slate-50 p-5 text-sm leading-7 text-muted">
              此政策內容尚未設定。若你是商家，請到後台「商店政策」編輯內容。
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

async function getPublicStorePolicySafely() {
  try {
    return await getPublicStorePolicy();
  } catch {
    return null;
  }
}
