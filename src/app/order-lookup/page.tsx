import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { getGuestOrderByEmail } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訪客訂單查詢"
};

type OrderLookupPageProps = {
  searchParams: Promise<{
    orderId?: string;
    email?: string;
  }>;
};

export default async function OrderLookupPage({ searchParams }: OrderLookupPageProps) {
  const params = await searchParams;
  const order =
    params.orderId && params.email
      ? await getGuestOrderByEmail(params.orderId, params.email)
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">訪客訂單查詢</h1>
        <form className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-6 shadow-sm sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Order ID</span>
            <input
              name="orderId"
              defaultValue={params.orderId || ""}
              required
              className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={params.email || ""}
              required
              className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              查詢訂單
            </button>
          </div>
        </form>

        {params.orderId && params.email && !order ? (
          <div className="mt-6 rounded-lg border border-dashed border-line bg-white p-8 text-center text-muted">
            查無符合此 Email 與訂單編號的訪客訂單。
          </div>
        ) : null}

        {order ? (
          <section className="mt-6 rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="font-mono text-xs text-muted">{order.id}</p>
                <h2 className="mt-2 text-xl font-bold text-ink">{order.status}</h2>
                <p className="mt-1 text-sm text-muted">
                  建立時間 {order.createdAt.toLocaleString("zh-TW")}
                </p>
              </div>
              <p className="text-2xl font-bold text-ink">{formatCurrency(order.total.toString())}</p>
            </div>
            <div className="mt-6 divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="font-medium text-ink">
                    {item.productName} x {item.quantity}
                  </span>
                  <span className="text-muted">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/products" className="mt-6 inline-flex text-sm font-semibold text-brand-700">
              繼續購物
            </Link>
          </section>
        ) : null}
      </section>
    </main>
  );
}
