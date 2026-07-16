import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { requireCustomerSession } from "@/lib/customer-session";
import {
  type OrderStatus as OrderStatusValue,
  type PaymentStatus as PaymentStatusValue
} from "@/lib/domain-types";
import { getCustomerOrders } from "@/modules/customers/customer.repository";
import { getDisplayOrderNumber } from "@/modules/orders/order-number";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的訂單"
};

const orderStatusLabels: Record<OrderStatusValue, string> = {
  pending: "待處理",
  unpaid: "未付款",
  paid: "已付款",
  processing: "處理中",
  shipped: "已出貨",
  cancelled: "已取消"
};

const paymentStatusLabels: Record<PaymentStatusValue, string> = {
  unpaid: "未付款",
  pending: "付款處理中",
  paid: "已付款",
  failed: "付款失敗",
  cancelled: "付款取消",
  expired: "付款逾時",
  refunded: "已退款"
};

export default async function AccountOrdersPage() {
  const session = await requireCustomerSession();
  const orders = await getCustomerOrders(session.userId);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link href="/account" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          返回會員中心
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Order History
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink" data-testid="customer-orders-heading">
              我的訂單
            </h1>
            <p className="mt-3 text-sm text-muted">查看訂單狀態、付款狀態與商品明細。</p>
          </div>
          <Link
            href="/products"
            className="w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
          >
            繼續逛商品
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-line bg-white p-5 shadow-sm"
                data-testid="customer-order-row"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-xs text-muted">訂單編號</p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-ink">
                      {getDisplayOrderNumber(order)}
                    </p>
                    <p className="mt-3 text-sm text-muted">
                      建立時間：{order.createdAt.toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={orderStatusLabels[order.status as OrderStatusValue]} />
                    <StatusBadge
                      label={paymentStatusLabels[order.paymentStatus as PaymentStatusValue]}
                      testId="customer-order-payment-status"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
                  <InfoBlock label="品項" value={`${order.items.length} 項`} />
                  <InfoBlock label="總金額" value={formatCurrency(order.total.toString())} />
                  <div className="flex items-end sm:justify-end">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-brand-500"
                    >
                      查看詳情
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-ink">目前沒有訂單</h2>
            <p className="mt-2 text-sm text-muted">完成第一筆訂單後，會在這裡看到訂單紀錄。</p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              前往商品列表
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ label, testId }: { label: string; testId?: string }) {
  return (
    <span
      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink"
      data-testid={testId}
    >
      {label}
    </span>
  );
}
