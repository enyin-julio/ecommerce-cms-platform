import Link from "next/link";
import type { Metadata } from "next";
import type { InputHTMLAttributes } from "react";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "會員登入"
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Login
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">會員登入</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            登入後可以進入會員中心，管理個人資料、查看訂單與追蹤付款狀態。
          </p>
          <div className="mt-6 rounded-lg border border-line bg-white p-5 text-sm leading-6 text-muted shadow-sm">
            還沒有會員也沒關係，你仍可用訪客身分下單。若已經有訪客訂單，可以用 Email 和訂單編號查詢。
          </div>
        </div>

        <form
          action="/api/customer/login"
          method="post"
          className="rounded-lg border border-line bg-white p-8 shadow-sm"
          data-testid="customer-login-form"
        >
          <h2 className="text-2xl font-bold text-ink">登入你的帳號</h2>
          {params.error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Email 或密碼不正確。
            </p>
          ) : null}
          <TextField label="Email" name="email" type="email" autoComplete="email" required />
          <TextField
            label="密碼"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="customer-login-submit"
          >
            登入
          </button>
          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-muted">
            <p>
              還沒有帳號嗎？{" "}
              <Link className="font-semibold text-brand-700" href="/register">
                註冊會員
              </Link>
            </p>
            <Link className="font-semibold text-brand-700" href="/order-lookup">
              查詢訪客訂單
            </Link>
          </div>
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
        data-testid={`customer-login-${name}`}
        {...props}
      />
    </label>
  );
}
