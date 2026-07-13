import type { Metadata } from "next";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = {
  title: "後台總覽"
};

const setupItems = [
  "PostgreSQL 與 Prisma migration 已建立",
  "後台登入與 RBAC 權限檢查已啟用",
  "商品、CMS 頁面、媒體庫、訂單與 CSV 匯出已完成 MVP",
  "E2E 測試與正式部署文件已整理"
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          總覽
        </p>
        <h2 className="mt-3 text-2xl font-bold text-ink">後台管理中心</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          這裡集中管理商品、頁面內容、媒體、訂單與網站設定。系統管理員可管理全部資料，
          商家帳號只會看到自己可管理的內容。
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="登入保護" value="已啟用" helper="/admin 底下頁面皆需登入" />
        <StatCard label="權限角色" value="RBAC" helper="admin、merchant、customer 分流管理" />
        <StatCard label="商品與頁面" value="MVP" helper="支援新增、編輯、發布與下架" />
        <StatCard label="訂單管理" value="已啟用" helper="可查看訂單、更新狀態與匯出 CSV" />
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">目前完成項目</h2>
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
