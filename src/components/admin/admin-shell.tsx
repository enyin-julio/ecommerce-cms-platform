import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { logoutAction } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/session-token";

const navItems = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/pages", label: "頁面管理" },
  { href: "/admin/media", label: "媒體庫" },
  { href: "/admin/orders", label: "訂單管理" },
  { href: "/admin/settings", label: "網站設定" }
];

const roleLabels: Record<AdminSession["role"], string> = {
  admin: "系統管理員",
  merchant: "商家",
  customer: "顧客"
};

type AdminShellProps = {
  children: ReactNode;
  session: AdminSession;
};

export function AdminShell({ children, session }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-ink lg:flex">
      <aside className="border-b border-line bg-white lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            電商 CMS 後台
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:overflow-visible">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium text-muted hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                {roleLabels[session.role]} / {session.email}
              </p>
              <h1 className="text-lg font-semibold text-ink">後台管理中心</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-brand-500"
              >
                查看前台
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  登出
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
