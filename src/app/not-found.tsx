import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">
          找不到這個頁面
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          這個連結可能已失效，或內容尚未發布。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          回到首頁
        </Link>
      </section>
    </main>
  );
}
