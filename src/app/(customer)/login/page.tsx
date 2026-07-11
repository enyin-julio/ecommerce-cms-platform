import Link from "next/link";
import type { Metadata } from "next";
import { customerLoginAction } from "@/app/(customer)/auth-actions";
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
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <form
          action={customerLoginAction}
          className="rounded-lg border border-line bg-white p-8 shadow-sm"
          data-testid="customer-login-form"
        >
          <h1 className="text-2xl font-bold text-ink">會員登入</h1>
          {params.error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Email 或密碼不正確。
            </p>
          ) : null}
          <TextField label="Email" name="email" type="email" required />
          <TextField label="密碼" name="password" type="password" required />
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="customer-login-submit"
          >
            登入
          </button>
          <p className="mt-4 text-center text-sm text-muted">
            還沒有帳號嗎？ <Link className="font-semibold text-brand-700" href="/register">註冊會員</Link>
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
        data-testid={`customer-login-${name}`}
        {...props}
      />
    </label>
  );
}
