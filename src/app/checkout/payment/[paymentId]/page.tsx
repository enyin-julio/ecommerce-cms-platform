import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "前往付款"
};

type CheckoutPaymentPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export default async function CheckoutPaymentPage({ params }: CheckoutPaymentPageProps) {
  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId
    },
    select: {
      status: true,
      actionUrl: true,
      formData: true,
      orderId: true
    }
  });

  if (!payment || payment.status !== "pending" || !payment.actionUrl || !payment.formData) {
    notFound();
  }

  const fields = payment.formData as Record<string, string>;

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          ECPay Sandbox
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">正在前往綠界測試付款頁</h1>
        <p className="mt-4 text-sm text-muted">
          訂單已建立但尚未付款。系統會自動導向綠界 Sandbox，若沒有自動跳轉，請按下方按鈕。
        </p>
        <form
          action={payment.actionUrl}
          method="post"
          className="mt-8"
          data-testid="ecpay-payment-form"
        >
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="ecpay-payment-submit"
          >
            前往綠界 Sandbox 付款
          </button>
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('load',function(){var form=document.querySelector('[data-testid=\"ecpay-payment-form\"]');if(form){form.submit();}});"
          }}
        />
      </section>
    </main>
  );
}
