import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { requireCustomerSession } from "@/lib/customer-session";
import { getCustomerOrderById } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訂單詳情"
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

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link href="/account/orders" className="text-sm font-semibold text-brand-700">
          返回訂單列表
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">訂單詳情</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard label="訂單編號" value={order.id} />
          <InfoCard label="訂單狀態" value={order.status} />
          <InfoCard label="建立時間" value={order.createdAt.toLocaleString("zh-TW")} />
        </div>
        <OrderItems order={order} />
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 break-all font-semibold text-ink">{value}</p>
    </div>
  );
}

function OrderItems({
  order
}: {
  order: NonNullable<Awaited<ReturnType<typeof getCustomerOrderById>>>;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">商品</th>
            <th className="px-5 py-3 font-semibold">單價</th>
            <th className="px-5 py-3 font-semibold">數量</th>
            <th className="px-5 py-3 font-semibold">小計</th>
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
      <div className="border-t border-line p-5 text-right">
        <p className="text-xl font-bold text-ink">總金額 {formatCurrency(order.total.toString())}</p>
      </div>
    </section>
  );
}
