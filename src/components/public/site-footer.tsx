import Link from "next/link";
import { storePolicyDefinitions } from "@/lib/store-policy-types";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

export async function SiteFooter() {
  const siteSetting = await getPublicSiteSettingSafely();
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="font-semibold text-ink">{siteName}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="商店政策">
          {storePolicyDefinitions.map((policy) => (
            <Link
              key={policy.key}
              href={`/policies/${policy.slug}`}
              className="hover:text-ink"
            >
              {policy.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
