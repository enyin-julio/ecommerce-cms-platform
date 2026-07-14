import Link from "next/link";
import type { Metadata } from "next";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/app/cart/actions";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency } from "@/lib/format";
import { productImagePlaceholder } from "@/lib/placeholders";
import { calculateCartTotals, getCurrentCart } from "@/modules/cart/cart.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "購物車"
};

export default async function CartPage() {
  const cart = await getCurrentCart();
  const totals = cart ? calculateCartTotals(cart) : { subtotal: 0, total: 0 };
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              購物車
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">確認購物車</h1>
            <p className="mt-3 text-sm text-muted">
              請確認商品、數量與金額。實際下單時，系統會再次檢查庫存並重新計算金額。
            </p>
          </div>
          <Link
            href="/products"
            className="w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
          >
            繼續逛商品
          </Link>
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr_auto]"
                  data-testid="cart-item"
                >
                  <div
                    className="aspect-square rounded-lg bg-slate-100 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${item.product.imageUrl || productImagePlaceholder}")`
                    }}
                    aria-label={`${item.product.name} 商品圖片`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-brand-700">
                      {item.product.isPublished ? "可購買" : "已下架"}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-ink">{item.product.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      單價 {formatCurrency(item.product.price.toString())}，庫存 {item.product.stock} 件
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form
                        action={updateCartItemQuantityAction.bind(null, item.id)}
                        className="flex items-center gap-2"
                      >
                        <label className="sr-only" htmlFor={`quantity-${item.id}`}>
                          更新數量
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          name="quantity"
                          type="number"
                          min="1"
                          max={Math.max(1, item.product.stock)}
                          defaultValue={item.quantity}
                          className="min-h-11 w-24 rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-brand-500"
                        >
                          更新
                        </button>
                      </form>
                      <form action={removeCartItemAction.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="rounded-full border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:border-red-300"
                        >
                          移除
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-muted">小計</p>
                    <p className="mt-1 text-lg font-bold text-ink">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <OrderSummary subtotal={totals.subtotal} total={totals.total} itemCount={itemCount} />
          </div>
        ) : (
          <EmptyCart />
        )}
      </section>
    </main>
  );
}

function OrderSummary({
  subtotal,
  total,
  itemCount
}: {
  subtotal: number;
  total: number;
  itemCount: number;
}) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">訂單摘要</h2>
      <div className="mt-5 space-y-3 border-b border-line pb-5">
        <div className="flex justify-between text-sm text-muted">
          <span>商品件數</span>
          <span>{itemCount} 件</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>商品小計</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>運費</span>
          <span>結帳頁確認</span>
        </div>
      </div>
      <div className="mt-5 flex justify-between text-base font-bold text-ink">
        <span>目前總金額</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
        data-testid="cart-checkout-link"
      >
        前往結帳
      </Link>
      <p className="mt-3 text-xs leading-5 text-muted">
        下一步會填寫收件資料並建立訂單，目前不會進行真實刷卡。
      </p>
    </aside>
  );
}

function EmptyCart() {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-10 text-center">
      <h2 className="text-xl font-bold text-ink">購物車目前是空的</h2>
      <p className="mt-2 text-sm text-muted">先挑選商品，加入購物車後再回來結帳。</p>
      <Link
        href="/products"
        className="mt-6 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        前往商品列表
      </Link>
    </div>
  );
}
