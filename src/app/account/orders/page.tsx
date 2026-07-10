import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { requireCustomerSession } from "@/lib/customer-session";
import { getCustomerOrders } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的訂單"
};

export default async function AccountOrdersPage() {
  const session = await requireCustomerSession();
  const orders = await getCustomerOrders(session.userId);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link href="/account" className="text-sm font-semibold text-brand-700">
          返回會員中心
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink" data-testid="customer-orders-heading">
          我的訂單
        </h1>
        <div className="mt-8 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">訂單編號</th>
                  <th className="px-5 py-3 font-semibold">狀態</th>
                  <th className="px-5 py-3 font-semibold">品項</th>
                  <th className="px-5 py-3 font-semibold">總金額</th>
                  <th className="px-5 py-3 font-semibold">建立時間</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} data-testid="customer-order-row">
                      <td className="px-5 py-4 font-mono text-xs text-muted">{order.id}</td>
                      <td className="px-5 py-4 text-muted">{order.status}</td>
                      <td className="px-5 py-4 text-muted">{order.items.length}</td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatCurrency(order.total.toString())}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {order.createdAt.toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/account/orders/${order.id}`} className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500">
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">
                      目前沒有訂單。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
