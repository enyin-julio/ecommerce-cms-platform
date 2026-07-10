import Link from "next/link";
import type { Metadata } from "next";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/app/cart/actions";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { productImagePlaceholder } from "@/lib/placeholders";
import { calculateCartTotals, getCurrentCart } from "@/modules/cart/cart.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart"
};

export default async function CartPage() {
  const cart = await getCurrentCart();
  const totals = cart ? calculateCartTotals(cart) : { subtotal: 0, total: 0 };

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Cart
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Shopping cart</h1>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-700">
            Continue shopping
          </Link>
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]"
                  data-testid="cart-item"
                >
                  <div
                    className="aspect-square rounded-lg bg-slate-100 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${item.product.imageUrl || productImagePlaceholder})`
                    }}
                  />
                  <div>
                    <h2 className="font-semibold text-ink">{item.product.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {formatCurrency(item.product.price.toString())} · Stock {item.product.stock}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form
                        action={updateCartItemQuantityAction.bind(null, item.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          max={Math.max(1, item.product.stock)}
                          defaultValue={item.quantity}
                          className="w-24 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-brand-500"
                        >
                          Update
                        </button>
                      </form>
                      <form action={removeCartItemAction.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="rounded-full border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:border-red-300"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="font-bold text-ink">
                    {formatCurrency(Number(item.product.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">Summary</h2>
              <div className="mt-4 flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 block rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
                data-testid="cart-checkout-link"
              >
                Checkout
              </Link>
            </aside>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-ink">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted">Add products before checkout.</p>
          </div>
        )}
      </section>
    </main>
  );
}
