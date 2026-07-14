import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { requireCustomerSession } from "@/lib/customer-session";
import {
  type OrderStatus as OrderStatusValue,
  type PaymentStatus as PaymentStatusValue
} from "@/lib/domain-types";
import { getCustomerOrderById } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訂單詳情"
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

type AccountOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const { id } = await params;
  const session = await requireCustomerSession();
  const order = await getCustomerOrderById(session.userId, id);

  if (!order) {
    notFound();
  }

  const shippingAddress = getShippingAddress(order.shippingAddress);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link href="/account/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          返回訂單列表
        </Link>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Order Detail
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">訂單詳情</h1>
          <p className="mt-3 break-all text-sm text-muted">訂單編號：{order.id}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <InfoCard label="訂單狀態" value={orderStatusLabels[order.status as OrderStatusValue]} />
          <InfoCard
            label="付款狀態"
            value={paymentStatusLabels[order.paymentStatus as PaymentStatusValue]}
            testId="customer-order-detail-payment-status"
          />
          <InfoCard label="建立時間" value={order.createdAt.toLocaleString("zh-TW")} />
          <InfoCard label="總金額" value={formatCurrency(order.total.toString())} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <OrderItems order={order} />

          <aside className="space-y-4">
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-ink">收件資訊</h2>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="姓名" value={order.customerName} />
                <InfoRow label="電話" value={order.customerPhone} />
                <InfoRow label="Email" value={order.customerEmail} />
                <InfoRow label="地址" value={shippingAddress || "未提供"} />
              </div>
            </section>

            {order.note ? (
              <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-ink">訂單備註</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{order.note}</p>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  testId
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 break-all font-semibold text-ink" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-ink">{value}</p>
    </div>
  );
}

function OrderItems({
  order
}: {
  order: NonNullable<Awaited<ReturnType<typeof getCustomerOrderById>>>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line p-5">
        <h2 className="text-lg font-bold text-ink">商品明細</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-muted">
            <tr>
              <th className="px-5 py-3">商品</th>
              <th className="px-5 py-3">單價</th>
              <th className="px-5 py-3">數量</th>
              <th className="px-5 py-3">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4 font-semibold text-ink">{item.productName}</td>
                <td className="px-5 py-4 text-muted">{formatCurrency(item.unitPrice.toString())}</td>
                <td className="px-5 py-4 text-muted">{item.quantity}</td>
                <td className="px-5 py-4 font-semibold text-ink">
                  {formatCurrency(Number(item.unitPrice) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line p-5 text-right">
        <p className="text-sm text-muted">總金額</p>
        <p className="mt-1 text-2xl font-bold text-ink">{formatCurrency(order.total.toString())}</p>
      </div>
    </section>
  );
}

function getShippingAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const address = (value as { address?: unknown }).address;
  return typeof address === "string" ? address : "";
}
