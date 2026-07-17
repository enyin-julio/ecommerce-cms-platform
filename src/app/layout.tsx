import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { PublicFooterGate } from "@/components/public/public-footer-gate";
import { SiteFooter } from "@/components/public/site-footer";
import { getThemePresetById } from "@/lib/theme-presets";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";
import "./globals.css";

type PublicSiteSetting = Awaited<ReturnType<typeof getPublicSiteSetting>>;

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSettingSafely();
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";
  const description =
    siteSetting?.seoDescription || "UZEEK 品牌商城提供精選商品、品牌故事與線上購物服務。";

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`
    },
    description,
    verification: siteSetting?.googleSearchConsoleVerification
      ? {
          google: siteSetting.googleSearchConsoleVerification
        }
      : undefined
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const siteSetting = await getPublicSiteSettingSafely();

  return (
    <html lang="zh-Hant">
      <body>
        <ThemeStyle siteSetting={siteSetting} />
        <MarketingScripts siteSetting={siteSetting} />
        {siteSetting?.googleTagManagerId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${siteSetting.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        {siteSetting?.metaPixelId ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${siteSetting.metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        {children}
        <PublicFooterGate>
          <SiteFooter />
        </PublicFooterGate>
      </body>
    </html>
  );
}

function MarketingScripts({ siteSetting }: { siteSetting: PublicSiteSetting | null }) {
  return (
    <>
      {siteSetting?.googleTagManagerId ? (
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${siteSetting.googleTagManagerId}');
            `
          }}
        />
      ) : null}

      {siteSetting?.googleAnalyticsMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${siteSetting.googleAnalyticsMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics-4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteSetting.googleAnalyticsMeasurementId}');
              `
            }}
          />
        </>
      ) : null}

      {siteSetting?.metaPixelId ? (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${siteSetting.metaPixelId}');
              fbq('track', 'PageView');
            `
          }}
        />
      ) : null}
    </>
  );
}

function ThemeStyle({ siteSetting }: { siteSetting: PublicSiteSetting | null }) {
  const theme = getThemePresetById(siteSetting?.themePreset);
  const primaryColor = siteSetting?.primaryColor || theme.primaryColor;
  const fontFamily = getThemeFontFamily(siteSetting?.themeFontFamily);
  const headingScale = getHeadingScale(siteSetting?.themeHeadingScale);

  return (
    <style
      id="site-theme-style"
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --site-theme-primary: ${primaryColor};
            --site-theme-soft: ${theme.softColor};
            --site-theme-accent: ${theme.accentColor};
            --site-heading-scale: ${headingScale};
          }
          body {
            font-family: ${fontFamily};
          }
          h1 {
            font-size: calc(3rem * var(--site-heading-scale));
          }
          h2 {
            font-size: calc(1.875rem * var(--site-heading-scale));
          }
          .text-brand-600,
          .text-brand-700,
          .hover\\:text-brand-700:hover,
          .hover\\:text-brand-800:hover {
            color: var(--site-theme-primary) !important;
          }
          .bg-brand-600,
          .hover\\:bg-brand-700:hover {
            background-color: var(--site-theme-primary) !important;
          }
          .bg-brand-50 {
            background-color: var(--site-theme-soft) !important;
          }
          .border-brand-500,
          .hover\\:border-brand-500:hover,
          .focus\\:border-brand-500:focus {
            border-color: var(--site-theme-primary) !important;
          }
        `
      }}
    />
  );
}

function getThemeFontFamily(value: string | null | undefined) {
  const fontFamilies: Record<string, string> = {
    "noto-sans-tc": '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif',
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
    rounded: '"Microsoft JhengHei", "PingFang TC", "Arial Rounded MT Bold", system-ui, sans-serif'
  };

  return fontFamilies[value || ""] || fontFamilies["noto-sans-tc"];
}

function getHeadingScale(value: string | null | undefined) {
  const scales: Record<string, string> = {
    compact: "0.9",
    default: "1",
    large: "1.12"
  };

  return scales[value || ""] || scales.default;
}

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
