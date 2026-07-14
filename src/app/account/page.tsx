import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes } from "react";
import { updateCustomerProfileAction } from "@/app/account/actions";
import { SiteHeader } from "@/components/public/site-header";
import { requireCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/modules/customers/customer.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "會員中心"
};

export default async function AccountPage() {
  const session = await requireCustomerSession();
  const customer = await getCustomerById(session.userId);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6" data-testid="customer-account">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              會員中心
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">我的帳戶</h1>
            <p className="mt-3 text-sm text-muted">管理基本資料，並查詢你的訂單紀錄。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-brand-500"
            >
              <span data-testid="account-orders-link">訂單查詢</span>
            </Link>
            <Link
              href="/logout"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              登出
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
              {(customer?.name || customer?.email || "會").slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">{customer?.name || "會員"}</h2>
            <p className="mt-2 break-all text-sm text-muted">{customer?.email}</p>
            <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <InfoRow label="電話" value={customer?.phone || "尚未填寫"} />
              <InfoRow label="地址" value={customer?.address || "尚未填寫"} />
            </div>
          </aside>

          <form
            action={updateCustomerProfileAction}
            className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-bold text-ink">基本資料</h2>
              <p className="mt-1 text-sm text-muted">
                更新後，之後結帳時可以更快帶入收件資料。
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="姓名" name="name" defaultValue={customer?.name || ""} required />
              <TextField label="電話" name="phone" defaultValue={customer?.phone || ""} />
            </div>
            <TextArea label="地址" name="address" defaultValue={customer?.address || ""} />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                儲存資料
              </button>
            </div>
          </form>
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
