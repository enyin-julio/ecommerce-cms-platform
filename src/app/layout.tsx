import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { getPublicSiteSetting } from "@/modules/settings/site-setting.repository";
import "./globals.css";

type PublicSiteSetting = Awaited<ReturnType<typeof getPublicSiteSetting>>;

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSettingSafely();
  const siteName = siteSetting?.siteName || "UZEEK 品牌商城";
  const description =
    siteSetting?.seoDescription || "探索 UZEEK 智慧電子鎖與品牌服務，打造安心、便利的智慧生活。";

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

async function getPublicSiteSettingSafely() {
  try {
    return await getPublicSiteSetting();
  } catch {
    return null;
  }
}
