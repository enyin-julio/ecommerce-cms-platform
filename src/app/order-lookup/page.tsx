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
  const hasSearched = Boolean(params.orderId && params.email);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Guest Order Lookup
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">訪客訂單查詢</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              若你沒有登入會員也完成下單，可使用訂單編號與下單 Email 查詢訂單內容。
            </p>
            <div className="mt-6 rounded-lg border border-line bg-white p-5 text-sm text-muted shadow-sm">
              會員訂單請登入後到會員中心查詢，資料會更完整。
            </div>
          </div>

          <div>
            <form className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <label className="block">
                <span className="text-sm font-semibold text-ink">訂單編號</span>
                <input
                  name="orderId"
                  defaultValue={params.orderId || ""}
                  required
                  className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                />
              </label>
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={params.email || ""}
                  required
                  className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                />
              </label>
              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                查詢訂單
              </button>
            </form>

            {hasSearched && !order ? (
              <div className="mt-6 rounded-lg border border-dashed border-line bg-white p-8 text-center">
                <h2 className="text-lg font-bold text-ink">查無訂單</h2>
                <p className="mt-2 text-sm text-muted">
                  請確認訂單編號與 Email 是否和下單時相同。
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {order ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-xs text-muted">訂單編號</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-ink">{order.id}</p>
                <p className="mt-3 text-sm text-muted">
                  建立時間：{order.createdAt.toLocaleString("zh-TW")}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-muted">總金額</p>
                <p className="mt-1 text-2xl font-bold text-ink">{formatCurrency(order.total.toString())}</p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-4 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{item.productName}</p>
                    <p className="mt-1 text-xs text-muted">數量 {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-ink">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-full border border-line px-5 py-3 text-center text-sm font-semibold text-ink hover:border-brand-500"
              >
                繼續逛商品
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                登入會員中心
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
