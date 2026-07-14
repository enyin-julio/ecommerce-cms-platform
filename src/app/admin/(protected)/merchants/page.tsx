import type { Metadata } from "next";
import {
  createMerchantAction,
  deleteMerchantAction,
  updateMerchantAction
} from "@/app/admin/(protected)/merchants/actions";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "商家管理"
};

type MerchantsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const merchants = await prisma.merchant.findMany({
    where:
      session.role === "merchant" && session.merchantId
        ? {
            id: session.merchantId
          }
        : undefined,
    include: {
      siteSetting: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          users: true,
          products: true,
          categories: true,
          pages: true,
          media: true,
          orders: true,
          carts: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return (
    <div className="space-y-8" data-testid="admin-merchants-page">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            商家設定
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">商家管理</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            管理商家名稱、網址代號與聯絡 Email。刪除商家前，必須先清空該商家的商品、分類、頁面、訂單、媒體、使用者與網站設定。
          </p>
        </div>
      </div>

      {params?.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {params.message}
        </div>
      ) : null}

      {session.role === "admin" ? (
        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-ink">新增商家</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            網址代號用於系統辨識，建議使用英文小寫與減號，例如 aih-brand。
          </p>
          <form action={createMerchantAction} className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <TextField label="商家名稱" name="name" placeholder="例如：AIH 品牌商城" required />
            <TextField label="網址代號（Slug）" name="slug" placeholder="例如：aih-brand" required />
            <TextField label="聯絡 Email" name="contactEmail" type="email" placeholder="service@example.com" required />
            <div className="flex items-end">
              <button
                type="submit"
                className="min-h-12 w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                data-testid="admin-merchant-create"
              >
                新增商家
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="border-b border-line p-6">
          <h3 className="text-xl font-bold text-ink">商家列表</h3>
          <p className="mt-2 text-sm text-muted">
            共 {merchants.length} 個商家。
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-slate-900 text-left text-white">
              <tr>
                <th className="px-5 py-4 font-semibold">商家名稱</th>
                <th className="px-5 py-4 font-semibold">網址代號</th>
                <th className="px-5 py-4 font-semibold">聯絡 Email</th>
                <th className="px-5 py-4 font-semibold">資料數量</th>
                <th className="px-5 py-4 font-semibold">最後更新</th>
                <th className="px-5 py-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {merchants.map((merchant) => {
                const relatedCount =
                  merchant._count.users +
                  merchant._count.products +
                  merchant._count.categories +
                  merchant._count.pages +
                  merchant._count.media +
                  merchant._count.orders +
                  merchant._count.carts +
                  (merchant.siteSetting ? 1 : 0);
                const canDelete = session.role === "admin" && relatedCount === 0;

                return (
                  <tr key={merchant.id} className="align-top hover:bg-slate-50" data-testid="admin-merchant-row">
                    <td className="px-5 py-4">
                      <form
                        id={`merchant-${merchant.id}`}
                        action={updateMerchantAction.bind(null, merchant.id)}
                        className="grid gap-3"
                      >
                        <input
                          name="name"
                          defaultValue={merchant.name}
                          className="min-h-11 rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
                          data-testid="admin-merchant-name"
                        />
                      </form>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        form={`merchant-${merchant.id}`}
                        name="slug"
                        defaultValue={merchant.slug}
                        className="min-h-11 rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
                        data-testid="admin-merchant-slug"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input
                        form={`merchant-${merchant.id}`}
                        name="contactEmail"
                        type="email"
                        defaultValue={merchant.contactEmail}
                        className="min-h-11 rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
                        data-testid="admin-merchant-email"
                      />
                    </td>
                    <td className="px-5 py-4 text-muted">
                      商品 {merchant._count.products}、分類 {merchant._count.categories}
                      <br />
                      頁面 {merchant._count.pages}、訂單 {merchant._count.orders}
                      <br />
                      媒體 {merchant._count.media}、使用者 {merchant._count.users}
                      {merchant.siteSetting ? (
                        <>
                          <br />
                          網站設定 1
                        </>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {new Intl.DateTimeFormat("zh-TW", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(merchant.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          form={`merchant-${merchant.id}`}
                          type="submit"
                          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-500"
                          data-testid="admin-merchant-update"
                        >
                          儲存
                        </button>

                        {session.role === "admin" ? (
                          <form action={deleteMerchantAction.bind(null, merchant.id)}>
                            <button
                              type="submit"
                              disabled={!canDelete}
                              className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
                              data-testid="admin-merchant-delete"
                            >
                              刪除
                            </button>
                            {!canDelete ? (
                              <p className="mt-2 max-w-40 text-xs leading-5 text-muted">
                                此商家仍有關聯資料，不能直接刪除。
                              </p>
                            ) : null}
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    目前沒有商家資料。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
        data-testid={`admin-merchant-${name}`}
        {...props}
      />
    </label>
  );
}
