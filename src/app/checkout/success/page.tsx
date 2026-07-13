import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "訂單建立成功"
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: "未付款",
  pending: "付款處理中",
  paid: "已付款",
  failed: "付款失敗",
  cancelled: "付款取消",
  expired: "付款逾時",
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
          paymentStatus: true
        }
      })
    : null;

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          訂單已建立
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">
          感謝你的訂購
        </h1>
        {params.orderId ? (
          <p className="mt-4 text-sm text-muted" data-testid="checkout-success-order-id">
            訂單編號：{params.orderId}
          </p>
        ) : null}
        {order ? (
          <p className="mt-3 text-sm font-semibold text-ink" data-testid="checkout-success-payment-status">
            付款狀態：{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </p>
        ) : null}
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          繼續逛商品
        </Link>
      </section>
    </main>
  );
}
