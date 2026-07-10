import type { Metadata } from "next";
import { loginAction } from "@/app/admin/login/actions";

export const metadata: Metadata = {
  title: "後台登入"
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-bold text-ink">登入管理後台</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          請使用管理者或商家帳號登入。customer 角色不可進入後台。
        </p>
        {params.error ? (
          <div
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            data-testid="admin-login-error"
          >
            Email 或密碼不正確，或此帳號沒有後台權限。
          </div>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4" data-testid="admin-login-form">
          <input type="hidden" name="next" value={params.next || "/admin"} />
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
              placeholder="admin@example.com"
              data-testid="admin-login-email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">密碼</span>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-500"
              placeholder="請輸入密碼"
              data-testid="admin-login-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            data-testid="admin-login-submit"
          >
            登入
          </button>
        </form>
      </section>
    </main>
  );
}
