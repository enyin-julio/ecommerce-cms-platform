import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "沒有權限"
};

export default function AdminForbiddenPage() {
  return (
    <section className="rounded-lg border border-line bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
        403
      </p>
      <h2 className="mt-3 text-2xl font-bold text-ink">沒有權限存取此內容</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        目前帳號無法管理這筆商家資料。系統管理員可管理全部資料，商家只能管理自己的商品、頁面與訂單。
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        返回後台總覽
      </Link>
    </section>
  );
}
