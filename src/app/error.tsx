"use client";

import Link from "next/link";

export default function ErrorPage({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-lg rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Error
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">
          系統暫時無法完成操作
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          請稍後再試，或返回首頁重新操作。系統不會在頁面上顯示資料庫錯誤細節。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            再試一次
          </button>
          <Link
            href="/"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-brand-500"
          >
            回到首頁
          </Link>
        </div>
      </section>
    </main>
  );
}
