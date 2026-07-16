import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes } from "react";
import { updateCustomerProfileAction } from "@/app/account/actions";
import { SiteHeader } from "@/components/public/site-header";
import { requireCustomerSession } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import { getCustomerById } from "@/modules/customers/customer.repository";
import { getDisplayOrderNumber } from "@/modules/orders/order-number";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "會員中心"
};

export default async function AccountPage() {
  const session = await requireCustomerSession();
  const [customer, orderCount, recentOrders] = await Promise.all([
    getCustomerById(session.userId),
    prisma.order.count({
      where: {
        userId: session.userId
      }
    }),
    prisma.order.findMany({
      where: {
        userId: session.userId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true
      },
      take: 3
    })
  ]);
  const displayName = customer?.name || "會員";
  const completionItems = [
    Boolean(customer?.name),
    Boolean(customer?.phone),
    Boolean(customer?.address)
  ];
  const completionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-200">
            Member Center
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">嗨，{displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                這裡是你的會員中心，可以管理個人資料、查看訂單與追蹤付款狀態。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/account/orders"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                data-testid="account-orders-link"
              >
                查看我的訂單
              </Link>
              <Link
                href="/logout"
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                登出
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" data-testid="customer-account">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
                {(customer?.name || customer?.email || "會").slice(0, 1).toUpperCase()}
              </div>
              <h2 className="mt-5 text-xl font-bold text-ink">{displayName}</h2>
              <p className="mt-2 break-all text-sm text-muted">{customer?.email}</p>
              <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                <InfoRow label="手機" value={customer?.phone || "尚未填寫"} />
                <InfoRow label="地址" value={customer?.address || "尚未填寫"} />
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">會員資料完成度</h2>
                <span className="text-sm font-semibold text-brand-700">{completionPercent}%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-brand-600"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                補齊手機與地址後，下次結帳會更快。
              </p>
            </div>

            <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink">訂單摘要</h2>
              <p className="mt-3 text-3xl font-bold text-ink">{orderCount}</p>
              <p className="mt-1 text-sm text-muted">目前綁定在此會員帳號的訂單數</p>
            </div>
          </aside>

          <div className="space-y-6">
            <form
              action={updateCustomerProfileAction}
              className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-xl font-bold text-ink">編輯會員資料</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  這些資料會在會員結帳時自動帶入，也方便日後查詢訂單。
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="姓名" name="name" defaultValue={customer?.name || ""} required />
                <TextField label="手機" name="phone" defaultValue={customer?.phone || ""} />
              </div>
              <TextArea label="地址" name="address" defaultValue={customer?.address || ""} />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  儲存會員資料
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-ink">近期訂單</h2>
                  <p className="mt-1 text-sm text-muted">查看最近建立的會員訂單。</p>
                </div>
                <Link
                  href="/account/orders"
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-brand-500"
                >
                  全部訂單
                </Link>
              </div>

              <div className="mt-5 divide-y divide-line">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex flex-col gap-2 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="break-all font-semibold text-ink">{getDisplayOrderNumber(order)}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Intl.DateTimeFormat("zh-TW", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        }).format(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        訂單：{order.status}
                      </span>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">
                        付款：{order.paymentStatus}
                      </span>
                    </div>
                  </Link>
                ))}
                {recentOrders.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-6 text-sm leading-6 text-muted">
                    目前還沒有會員訂單。你可以先去商品頁逛逛，或用訪客訂單查詢找回未綁定的訂單。
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-ink">{value}</p>
    </div>
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
        {...props}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
    </label>
  );
}
