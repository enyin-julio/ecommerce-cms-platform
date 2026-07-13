import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";

export default function HomePage() {
  const highlights = [
    "品牌形象官網",
    "形象廣告頁",
    "商品型錄",
    "後台管理"
  ];

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              品牌電商 CMS
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              用一套後台管理品牌內容、商品與訂單
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              AIH 品牌商城整合 Next.js、Prisma 與 PostgreSQL，讓商家可以管理品牌頁、商品型錄、購物流程與後台營運。
              前台支援響應式頁面與 SEO，適合逐步擴充成完整電商平台。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                查看商品
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
              >
                進入後台
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-ink">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    從後台維護內容、圖片、SEO、商品與訂單資料，讓網站營運流程更清楚。
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
