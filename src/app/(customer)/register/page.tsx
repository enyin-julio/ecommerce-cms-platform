import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes } from "react";
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
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Create Account
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">註冊會員</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            建立會員後，可在會員中心維護常用資料，並查看自己的訂單紀錄。
          </p>
          <div className="mt-6 rounded-lg border border-line bg-white p-5 text-sm text-muted shadow-sm">
            密碼至少 8 個字元。註冊後會自動登入並前往會員中心。
          </div>
        </div>

        <form
          action="/api/customer/register"
          method="post"
          className="rounded-lg border border-line bg-white p-8 shadow-sm"
          data-testid="customer-register-form"
        >
          <h2 className="text-2xl font-bold text-ink">建立帳號</h2>
          {params.error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              無法完成註冊，請確認資料是否正確，或改用登入。
            </p>
          ) : null}
          <TextField label="姓名" name="name" autoComplete="name" required />
          <TextField label="Email" name="email" type="email" autoComplete="email" required />
          <TextField
            label="密碼"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <TextField label="電話" name="phone" autoComplete="tel" />
          <TextArea label="地址" name="address" />
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="customer-register-submit"
          >
            建立會員
          </button>
          <p className="mt-5 text-center text-sm text-muted">
            已經有帳號了？{" "}
            <Link className="font-semibold text-brand-700" href="/login">
              前往登入
            </Link>
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
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={`customer-register-${name}`}
        {...props}
      />
    </label>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label className="mt-5 block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        rows={3}
        className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        data-testid={`customer-register-${name}`}
      />
    </label>
  );
}
