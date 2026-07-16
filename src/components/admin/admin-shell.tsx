import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/session-token";

const navGroups = [
  {
    label: "常用",
    items: [
      { href: "/admin", label: "總覽" },
      { href: "/admin/account", label: "帳號設定" }
    ]
  },
  {
    label: "商店設定",
    items: [
      { href: "/admin/merchants", label: "商家管理" },
      { href: "/admin/settings", label: "網站設定" },
      { href: "/admin/themes", label: "主題管理" },
      { href: "/admin/policies", label: "商店政策" },
      { href: "/admin/marketing", label: "行銷管理" }
    ]
  },
  {
    label: "內容管理",
    items: [
      { href: "/admin/pages", label: "頁面管理" },
      { href: "/admin/media", label: "媒體庫" }
    ]
  },
  {
    label: "商品營運",
    items: [
      { href: "/admin/products", label: "商品管理" },
      { href: "/admin/categories", label: "商品分類" },
      { href: "/admin/orders", label: "訂單管理" }
    ]
  }
];

const roleLabels: Record<AdminSession["role"], string> = {
  admin: "系統管理員",
  merchant: "商家",
  customer: "會員"
};

type AdminShellProps = {
  children: ReactNode;
  session: AdminSession;
};

export function AdminShell({ children, session }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-ink lg:flex">
      <aside className="border-b border-line bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 lg:h-20">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            電商 CMS 後台
          </Link>
        </div>
        <nav className="flex gap-3 overflow-x-auto px-4 pb-4 lg:block lg:min-h-0 lg:flex-1 lg:space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-8">
          {navGroups.map((group) => (
            <details
              key={group.label}
              open
              className="min-w-44 rounded-lg border border-line bg-white lg:min-w-0"
            >
              <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-bold text-ink hover:bg-slate-50">
                <span className="flex items-center justify-between gap-3">
                  {group.label}
                  <span className="text-xs text-muted">展開</span>
                </span>
              </summary>
              <div className="space-y-1 border-t border-line p-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-brand-50 hover:text-brand-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
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
                target="_blank"
                rel="noopener noreferrer"
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
