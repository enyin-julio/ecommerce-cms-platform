import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "訂單已建立"
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: "未付款",
  pending: "付款處理中",
  paid: "已付款",
  failed: "付款失敗",
  cancelled: "付款已取消",
  expired: "付款已逾期",
  refunded: "已退款"
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const order = params.orderId
    ? await prisma.order.findUnique({
        where: {
          id: params.orderId
        },
        select: {
          paymentStatus: true,
          total: true
        }
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-700">
            ✓
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Order Created
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">訂單已建立</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            我們已收到你的訂單。正式金流開通前，測試訂單會保持未付款狀態，不會進行真實刷卡或收款。
          </p>

          <div className="mt-8 rounded-lg bg-slate-50 p-5 text-left">
            {params.orderId ? (
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <span className="text-sm text-muted">訂單編號</span>
                <span className="break-all text-sm font-semibold text-ink" data-testid="checkout-success-order-id">
                  {params.orderId}
                </span>
              </div>
            ) : null}
            {order ? (
              <>
                <div className="mt-4 flex flex-col justify-between gap-1 border-t border-line pt-4 sm:flex-row">
                  <span className="text-sm text-muted">付款狀態</span>
                  <span className="text-sm font-semibold text-ink" data-testid="checkout-success-payment-status">
                    {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                  </span>
                </div>
                <div className="mt-4 flex flex-col justify-between gap-1 border-t border-line pt-4 sm:flex-row">
                  <span className="text-sm text-muted">訂單金額</span>
                  <span className="text-sm font-semibold text-ink">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/account/orders"
              className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-brand-500"
            >
              查看我的訂單
            </Link>
            <Link
              href="/products"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              繼續逛商品
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
