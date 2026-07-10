import Link from "next/link";
import type { Metadata } from "next";
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

export default async function CheckoutPage() {
  const cart = await getCurrentCart();
  const session = await getCurrentCustomerSession();
  const customer = session ? await getCustomerById(session.userId) : null;
  const totals = cart ? calculateCartTotals(cart) : { subtotal: 0, total: 0 };

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Link href="/cart" className="text-sm font-semibold text-brand-700">
            返回購物車
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">結帳</h1>
          <form
            action={checkoutAction}
            className="mt-6 space-y-5 rounded-lg border border-line bg-white p-6 shadow-sm"
            data-testid="checkout-form"
          >
            <TextField label="姓名" name="customerName" defaultValue={customer?.name || ""} required />
            <TextField label="電話" name="customerPhone" defaultValue={customer?.phone || ""} required />
            <TextField label="Email" name="customerEmail" type="email" defaultValue={customer?.email || ""} required />
            <TextArea label="地址" name="address" defaultValue={customer?.address || ""} required />
            <TextArea label="備註" name="note" />
            <button
              type="submit"
              disabled={!cart || cart.items.length === 0}
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              data-testid="place-order"
            >
              送出訂單
            </button>
          </form>
        </div>
        <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">訂單摘要</h2>
          <div className="mt-4 space-y-3">
            {cart?.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="text-muted">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-semibold text-ink">
                  {formatCurrency(Number(item.product.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex justify-between text-base font-bold text-ink">
              <span>總金額</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
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
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
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
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
        data-testid={`checkout-${name}`}
        {...props}
      />
    </label>
  );
}
