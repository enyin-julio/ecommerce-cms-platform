import type { Metadata } from "next";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = {
  title: "後台總覽"
};

const setupItems = [
  "PostgreSQL 與 Prisma migration 已可執行",
  "後台登入與 RBAC 權限保護已啟用",
  "商品、CMS、媒體、訂單與 CSV 匯出已納入 MVP",
  "E2E 測試會驗證核心營運流程"
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Dashboard
        </p>
        <h2 className="mt-3 text-2xl font-bold text-ink">後台總覽</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          這裡集中顯示商家管理網站內容、商品、訂單與營運資料的入口。
          第一版保持模組化單體架構，方便穩定擴充。
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="登入保護" value="已啟用" helper="/admin 頁面需登入後才能使用" />
        <StatCard label="權限模型" value="RBAC" helper="admin、merchant、customer 分流" />
        <StatCard label="商品與 CMS" value="MVP" helper="支援新增、編輯與發布狀態" />
        <StatCard label="訂單管理" value="可用" helper="包含搜尋、狀態更新與 CSV 匯出" />
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">上線前檢查重點</h2>
        <div className="mt-4 grid gap-3">
          {setupItems.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-4 text-sm text-muted">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
