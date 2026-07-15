import Link from "next/link";
import type { Metadata } from "next";
import { formatCurrency } from "@/lib/format";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminDashboardData } from "@/modules/admin/dashboard.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "後台總覽"
};

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const data = await getDashboardDataSafely(session);
  const siteName = data.siteSetting?.siteName || data.primaryMerchant?.name || "尚未設定網站名稱";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aih.tw";
  const activityRows = buildActivityRows(data);

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          總覽
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink">歡迎回來</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          從這裡快速查看網站狀態、訂單資訊、內容數量與最近異動。
        </p>
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-muted">電商網站</p>
            <h3 className="mt-2 text-2xl font-bold text-ink">{siteName}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <Link
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                {siteUrl}
              </Link>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                已公開
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/settings"
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-brand-500"
            >
              編輯網站設定
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              查看前台
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="訂單資訊" />
        <div className="grid gap-4 rounded-lg border border-line bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="全部訂單" value={`共 ${data.totalOrderCount} 筆`} />
          <MetricCard
            label="今日總金額"
            value={formatCurrency(data.todayOrderTotal?.toString() || "0")}
          />
          <MetricCard label="今日新增訂單" value={`共 ${data.todayOrderCount} 筆`} />
          <MetricCard label="未付款訂單" value={`共 ${data.unpaidOrderCount} 筆`} />
          <MetricCard label="待處理訂單" value={`共 ${data.pendingOrderCount} 筆`} />
          <p className="text-sm leading-6 text-muted sm:col-span-2 lg:col-span-4">
            「全部訂單」會與訂單管理列表的總筆數一致；其他卡片是依付款與處理狀態拆出的營運指標。
          </p>
          <div className="sm:col-span-2 lg:col-span-1 lg:text-right">
            <Link
              href="/admin/orders"
              className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              前往訂單管理
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="內容狀態" />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricPanel label="已上架商品" value={`${data.publishedProductCount}`} href="/admin/products" />
          <MetricPanel label="已發布頁面" value={`${data.publishedPageCount}`} href="/admin/pages" />
          <MetricPanel label="媒體檔案" value={`${data.mediaCount}`} href="/admin/media" />
        </div>
      </section>

      <section>
        <SectionTitle title="最近活動" />
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-3 font-semibold">類型</th>
                <th className="px-5 py-3 font-semibold">內容</th>
                <th className="px-5 py-3 font-semibold">時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {activityRows.map((item) => (
                <tr key={`${item.type}-${item.title}-${item.time}`}>
                  <td className="px-5 py-4 text-muted">{item.type}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{item.title}</td>
                  <td className="px-5 py-4 text-muted">{item.time.toLocaleString("zh-TW")}</td>
                </tr>
              ))}
              {activityRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-muted">
                    目前沒有近期活動。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      <div className="mt-2 h-0.5 w-10 bg-amber-500" />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function MetricPanel({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line bg-white p-6 shadow-sm hover:border-brand-500"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-3 text-sm font-semibold text-brand-700">查看管理</p>
    </Link>
  );
}

function buildActivityRows(data: {
  recentOrders: Array<{
    customerName: string;
    total: { toString(): string };
    createdAt: Date;
  }>;
  recentProducts: Array<{
    name: string;
    updatedAt: Date;
  }>;
  recentPages: Array<{
    title: string;
    updatedAt: Date;
  }>;
}) {
  return [
    ...data.recentOrders.map((order) => ({
      type: "訂單",
      title: `${order.customerName} / ${formatCurrency(order.total.toString())}`,
      time: order.createdAt
    })),
    ...data.recentProducts.map((product) => ({
      type: "商品",
      title: product.name,
      time: product.updatedAt
    })),
    ...data.recentPages.map((page) => ({
      type: "頁面",
      title: page.title,
      time: page.updatedAt
    }))
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);
}

async function getDashboardDataSafely(session: Awaited<ReturnType<typeof requireAdminSession>>) {
  try {
    return await getAdminDashboardData(session);
  } catch {
    return {
      siteSetting: null,
      primaryMerchant: null,
      merchants: [],
      todayOrderTotal: null,
      totalOrderCount: 0,
      todayOrderCount: 0,
      unpaidOrderCount: 0,
      pendingOrderCount: 0,
      publishedProductCount: 0,
      publishedPageCount: 0,
      mediaCount: 0,
      recentOrders: [],
      recentProducts: [],
      recentPages: []
    };
  }
}
