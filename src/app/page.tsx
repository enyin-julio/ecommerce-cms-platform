import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Modular commerce CMS
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              同時建立品牌官網、商品型錄與電商網站
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              以 Next.js、Prisma、PostgreSQL 打造的可編輯後台平台。第一版採 Modular Monolith，
              保持穩定、清楚，並為搜尋、快取、金流與物流預留擴充位置。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                查看商品型錄
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
              >
                進入管理後台
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              {["品牌形象頁", "Landing Page", "商品列表", "訂單管理"].map((item) => (
                <div key={item} className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-ink">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    可由商家後台逐步管理，支援 SEO 與手機版排版。
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
