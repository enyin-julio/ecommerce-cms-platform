import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order success"
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
          Order created
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">
          Thank you for your order
        </h1>
        {params.orderId ? (
          <p className="mt-4 text-sm text-muted" data-testid="checkout-success-order-id">
            Order ID: {params.orderId}
          </p>
        ) : null}
        {order ? (
          <p className="mt-3 text-sm font-semibold text-ink" data-testid="checkout-success-payment-status">
            Payment status: {order.paymentStatus}
          </p>
        ) : null}
        <Link
          href="/products"
          className="mt-8 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Continue shopping
        </Link>
      </section>
    </main>
  );
}
