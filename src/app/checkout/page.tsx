import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { checkoutAction } from "@/app/cart/actions";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { getCurrentCustomerSession } from "@/lib/customer-session";
import { calculateCartTotals, getCurrentCart } from "@/modules/cart/cart.service";
import { getCustomerById } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "結帳"
};

type CheckoutPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const cart = await getCurrentCart();
  const session = await getCurrentCustomerSession();
  const customer = session ? await getCustomerById(session.userId) : null;
  const totals = cart ? calculateCartTotals(cart) : { subtotal: 0, total: 0 };
  const params = await searchParams;
  const errorMessage =
    params?.error === "payment-not-enabled"
      ? "ECPay production is not enabled。正式金流尚未開啟，請改用測試模式或聯絡系統管理員。"
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <Link href="/cart" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            返回購物車
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Checkout
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">填寫結帳資料</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            請確認聯絡資訊與配送地址。訂單金額會由系統在後端重新計算，確保資料安全正確。
          </p>
        </div>

        {errorMessage ? (
          <div
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            data-testid="checkout-error"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            action={checkoutAction}
            className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
            data-testid="checkout-form"
          >
            <section>
              <h2 className="text-lg font-bold text-ink">收件人資料</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <TextField
                  label="姓名"
                  name="customerName"
                  defaultValue={customer?.name || ""}
                  required
                />
                <TextField
                  label="手機"
                  name="customerPhone"
                  defaultValue={customer?.phone || ""}
                  required
                />
              </div>
              <div className="mt-5">
                <TextField
                  label="Email"
                  name="customerEmail"
                  type="email"
                  defaultValue={customer?.email || ""}
                  required
                />
              </div>
              <div className="mt-5">
                <TextArea
                  label="配送地址"
                  name="address"
                  defaultValue={customer?.address || ""}
                  required
                />
              </div>
            </section>

            <section className="border-t border-line pt-6">
              <h2 className="text-lg font-bold text-ink">訂單備註</h2>
              <div className="mt-5">
                <TextArea label="備註" name="note" placeholder="例如希望配送時段或其他注意事項" />
              </div>
            </section>

            <section className="border-t border-line pt-6">
              <h2 className="text-lg font-bold text-ink">付款測試模式</h2>
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-ink">模擬付款結果</span>
                <select
                  name="mockPaymentResult"
                  defaultValue="success"
                  className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                  data-testid="checkout-mock-payment-result"
                >
                  <option value="success">模擬付款成功</option>
                  <option value="failed">模擬付款失敗</option>
                </select>
                <span className="mt-2 block text-xs leading-5 text-muted">
                  目前正式金流尚未啟用，這裡只用於測試訂單流程，不會儲存信用卡資料。
                </span>
              </label>
            </section>

            <button
              type="submit"
              disabled={!cart || cart.items.length === 0}
              className="w-full rounded-full bg-brand-600 px-6 py-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="place-order"
            >
              建立訂單
            </button>
          </form>

          <CheckoutSummary cart={cart} subtotal={totals.subtotal} total={totals.total} />
        </div>
      </section>
    </main>
  );
}

function CheckoutSummary({
  cart,
  subtotal,
  total
}: {
  cart: Awaited<ReturnType<typeof getCurrentCart>>;
  subtotal: number;
  total: number;
}) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">訂單摘要</h2>
      {cart && cart.items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold text-ink">{item.product.name}</p>
                <p className="mt-1 text-xs text-muted">數量 {item.quantity}</p>
              </div>
              <span className="font-semibold text-ink">
                {formatCurrency(Number(item.product.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">購物車目前是空的。</p>
      )}

      <div className="mt-6 space-y-3 border-t border-line pt-5">
        <div className="flex justify-between text-sm text-muted">
          <span>商品小計</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>運費</span>
          <span>尚未計算</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>總金額</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted">
        送出訂單後，系統會建立訂單與付款紀錄。正式金流開通前，請只建立 TEST 測試訂單。
      </p>
    </aside>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={`checkout-${name}`}
        {...props}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        data-testid={`checkout-${name}`}
        {...props}
      />
    </label>
  );
}
