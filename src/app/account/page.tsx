import Link from "next/link";
import type { Metadata } from "next";
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
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6" data-testid="customer-account">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              會員中心
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              我的帳戶
            </h1>
            <p className="mt-2 text-sm text-muted">{customer?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/account/orders" className="rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-brand-500">
              <span data-testid="account-orders-link">
              訂單查詢
              </span>
            </Link>
            <Link href="/logout" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              登出
            </Link>
          </div>
        </div>

        <form action={updateCustomerProfileAction} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 shadow-sm">
          <TextField label="姓名" name="name" defaultValue={customer?.name || ""} required />
          <TextField label="電話" name="phone" defaultValue={customer?.phone || ""} />
          <TextArea label="地址" name="address" defaultValue={customer?.address || ""} />
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            儲存資料
          </button>
        </form>
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
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
      />
    </label>
  );
}
