import Link from "next/link";
import { storePolicyDefinitions } from "@/lib/store-policy-types";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";

export async function SiteFooter() {
  const siteSetting = await getPublicSiteSettingSafely();
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";
  const footerStyle = siteSetting?.themeFooterStyle || "footer-1";

  if (footerStyle === "footer-3") {
    return (
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:px-6">
          <p className="font-semibold text-ink">{siteName}</p>
          <PolicyLinks compact />
        </div>
      </footer>
    );
  }

  if (footerStyle === "footer-4") {
    return (
      <footer className="border-t border-line bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xl font-bold">{siteName}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              感謝你的造訪。你可以從這裡查看商店政策、服務條款與購物相關說明。
            </p>
          </div>
          <PolicyLinks dark />
        </div>
      </footer>
    );
  }

  if (footerStyle === "footer-2") {
    return (
      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-bold text-ink">{siteName}</p>
            <p className="mt-2 text-muted">品牌資訊、購物說明與商店政策。</p>
          </div>
          <PolicyLinks columns />
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="font-semibold text-ink">{siteName}</p>
        <PolicyLinks />
      </div>
    </footer>
  );
}

function PolicyLinks({
  compact = false,
  dark = false,
  columns = false
}: {
  compact?: boolean;
  dark?: boolean;
  columns?: boolean;
}) {
  const className = columns
    ? "grid gap-3 sm:grid-cols-2"
    : compact
      ? "flex flex-wrap gap-x-3 gap-y-2"
      : "flex flex-wrap gap-x-4 gap-y-2";

  return (
    <nav className={className} aria-label="商店政策">
      {storePolicyDefinitions.map((policy) => (
        <Link
          key={policy.key}
          href={`/policies/${policy.slug}`}
          className={dark ? "text-slate-200 hover:text-white" : "text-muted hover:text-ink"}
        >
          {policy.title}
        </Link>
      ))}
    </nav>
  );
}

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
