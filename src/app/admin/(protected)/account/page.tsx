import type { Metadata } from "next";
import { updateAdminPasswordAction } from "@/app/admin/(protected)/account/actions";
import { requireAdminSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "帳號設定"
};

const errorMessages: Record<string, string> = {
  invalid: "請確認新密碼至少 12 碼，並包含英文大小寫、數字與符號。",
  current: "目前密碼不正確，請重新輸入。"
};

type AdminAccountPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function AdminAccountPage({ searchParams }: AdminAccountPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <div className="space-y-8" data-testid="admin-account-page">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          總覽 / 帳號設定
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink">帳號設定</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          你可以在這裡修改目前登入後台帳號的密碼。系統不會儲存明碼密碼。
        </p>
      </section>

      {params.saved ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          密碼已更新。下次登入請使用新密碼。
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-ink">目前帳號</h3>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-muted">名稱</dt>
              <dd className="mt-1 text-ink">{session.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Email</dt>
              <dd className="mt-1 text-ink">{session.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">角色</dt>
              <dd className="mt-1 text-ink">{session.role === "admin" ? "系統管理員" : "商家"}</dd>
            </div>
          </dl>
        </div>

        <form
          action={updateAdminPasswordAction}
          className="rounded-lg border border-line bg-white p-6 shadow-sm"
        >
          <h3 className="text-xl font-bold text-ink">修改密碼</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            新密碼至少 12 碼，需包含英文大寫、小寫、數字與符號。
          </p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-ink">目前密碼</span>
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
                className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                data-testid="admin-current-password"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">新密碼</span>
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                minLength={12}
                required
                className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                data-testid="admin-new-password"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">再次輸入新密碼</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={12}
                required
                className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                data-testid="admin-confirm-password"
              />
            </label>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              data-testid="admin-password-submit"
            >
              儲存新密碼
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
