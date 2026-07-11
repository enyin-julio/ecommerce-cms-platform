import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "會員註冊"
};

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <form
          action="/api/customer/register"
          method="post"
          className="rounded-lg border border-line bg-white p-8 shadow-sm"
          data-testid="customer-register-form"
        >
          <h1 className="text-2xl font-bold text-ink">註冊會員</h1>
          {params.error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              無法完成註冊，請確認資料是否正確，或改用登入。
            </p>
          ) : null}
          <TextField label="姓名" name="name" required />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="密碼" name="password" type="password" required minLength={8} />
          <TextField label="電話" name="phone" />
          <TextArea label="地址" name="address" />
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="customer-register-submit"
          >
            建立帳號
          </button>
          <p className="mt-4 text-center text-sm text-muted">
            已經有帳號了？ <Link className="font-semibold text-brand-700" href="/login">前往登入</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function TextField({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
        data-testid={`customer-register-${name}`}
        {...props}
      />
    </label>
  );
}

function TextArea({
  label,
  name
}: {
  label: string;
  name: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        rows={3}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
        data-testid={`customer-register-${name}`}
      />
    </label>
  );
}
