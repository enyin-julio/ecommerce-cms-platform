import Link from "next/link";
import type { Metadata } from "next";
import {
  OrderStatus,
  PaymentStatus,
  type OrderStatus as OrderStatusValue,
  type PaymentStatus as PaymentStatusValue
} from "@/lib/domain-types";
import { formatCurrency } from "@/lib/format";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminOrders, type AdminOrderFilters } from "@/modules/orders/order.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訂單管理"
};

type AdminOrdersPageProps = {
  searchParams: Promise<{
    keyword?: string;
    status?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

const orderStatuses: OrderStatusValue[] = [
  OrderStatus.pending,
  OrderStatus.unpaid,
  OrderStatus.paid,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.cancelled
];

const paymentStatuses: PaymentStatusValue[] = [
  PaymentStatus.unpaid,
  PaymentStatus.pending,
  PaymentStatus.paid,
  PaymentStatus.failed,
  PaymentStatus.cancelled,
  PaymentStatus.expired,
  PaymentStatus.refunded
];

const statusLabels: Record<OrderStatusValue, string> = {
  pending: "待處理",
  unpaid: "未付款",
  paid: "已付款",
  processing: "處理中",
  shipped: "已出貨",
  cancelled: "已取消"
};

const paymentStatusLabels: Record<PaymentStatusValue, string> = {
  unpaid: "未付款",
  pending: "付款處理中",
  paid: "已付款",
  failed: "付款失敗",
  cancelled: "付款取消",
  expired: "付款逾時",
  refunded: "已退款"
};

const exportFieldOptions = [
  ["orderId", "訂單編號"],
  ["status", "訂單狀態"],
  ["paymentStatus", "付款狀態"],
  ["customerName", "客戶姓名"],
  ["customerPhone", "電話"],
  ["customerEmail", "Email"],
  ["address", "地址"],
  ["productName", "商品名稱"],
  ["sku", "SKU"],
  ["quantity", "數量"],
  ["unitPrice", "單價"],
  ["lineSubtotal", "小計"],
  ["total", "總金額"],
  ["createdAt", "建立時間"],
  ["updatedAt", "更新時間"]
] as const;

const defaultExportFields = new Set([
  "orderId",
  "status",
  "paymentStatus",
  "customerName",
  "customerPhone",
  "customerEmail",
  "total",
  "createdAt"
]);

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const session = await requireAdminSession();
  const filters = parseFilters(params);
  const result = await getAdminOrdersSafely(session, filters);

  return (
    <div className="space-y-6" data-testid="admin-orders-page">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Orders
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink">訂單管理</h2>
        <p className="mt-2 text-sm text-muted">
          {session.role === "admin"
            ? "管理全平台訂單、付款狀態與出貨流程。"
            : "管理與你商品相關的訂單與付款狀態。"}
        </p>
      </section>

      <form
        className="grid gap-3 rounded-lg border border-line bg-white p-5 shadow-sm md:grid-cols-6"
        data-testid="admin-orders-filter-form"
      >
        <label className="block md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            關鍵字
          </span>
          <input
            name="keyword"
            defaultValue={filters.keyword || ""}
            placeholder="訂單編號、姓名、電話或 Email"
            className="mt-2 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            data-testid="admin-orders-keyword"
          />
        </label>
        <SelectField
          label="訂單狀態"
          name="status"
          value={filters.status || ""}
          options={orderStatuses.map((status) => [status, statusLabels[status]])}
          testId="admin-orders-status-filter"
        />
        <SelectField
          label="付款狀態"
          name="paymentStatus"
          value={filters.paymentStatus || ""}
          options={paymentStatuses.map((status) => [status, paymentStatusLabels[status]])}
          testId="admin-orders-payment-status-filter"
        />
        <DateField label="開始日期" name="dateFrom" value={filters.dateFrom || ""} />
        <DateField label="結束日期" name="dateTo" value={filters.dateTo || ""} />
        <div className="flex items-end gap-2 md:col-span-6">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            搜尋
          </button>
          <Link
            href="/admin/orders"
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-brand-500"
          >
            清除篩選
          </Link>
        </div>
      </form>

      <form
        action="/admin/orders/export"
        method="get"
        className="rounded-lg border border-line bg-white p-5 shadow-sm"
        data-testid="admin-orders-export-form"
      >
        <input type="hidden" name="keyword" value={filters.keyword || ""} />
        <input type="hidden" name="status" value={filters.status || ""} />
        <input type="hidden" name="paymentStatus" value={filters.paymentStatus || ""} />
        <input type="hidden" name="dateFrom" value={filters.dateFrom || ""} />
        <input type="hidden" name="dateTo" value={filters.dateTo || ""} />
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-ink">匯出 CSV</p>
            <p className="mt-1 text-sm text-muted">
              依目前篩選條件匯出目前帳號有權限查看的訂單資料，只供對帳、出貨與營運分析。
            </p>
          </div>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            data-testid="admin-orders-export-submit"
          >
            匯出 CSV
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {exportFieldOptions.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="fields"
                value={value}
                defaultChecked={defaultExportFields.has(value)}
                className="h-4 w-4 rounded border-line"
                data-testid={`admin-orders-export-field-${value}`}
              />
              {label}
            </label>
          ))}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">訂單編號</th>
                <th className="px-5 py-3 font-semibold">客戶</th>
                <th className="px-5 py-3 font-semibold">商家</th>
                <th className="px-5 py-3 font-semibold">品項</th>
                <th className="px-5 py-3 font-semibold">總金額</th>
                <th className="px-5 py-3 font-semibold">訂單狀態</th>
                <th className="px-5 py-3 font-semibold">付款狀態</th>
                <th className="px-5 py-3 font-semibold">建立時間</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.orders.length > 0 ? (
                result.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50" data-testid="admin-order-row">
                    <td className="px-5 py-4 font-mono text-xs text-muted">{order.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{order.customerName}</p>
                      <p className="mt-1 text-xs text-muted">{order.customerEmail}</p>
                      <p className="mt-1 text-xs text-muted">{order.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">{order.merchant.name}</td>
                    <td className="px-5 py-4 text-muted">{order.items.length}</td>
                    <td className="px-5 py-4 font-semibold text-ink">
                      {formatCurrency(order.total.toString())}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill label={statusLabels[order.status as OrderStatusValue]} />
                    </td>
                    <td className="px-5 py-4" data-testid="admin-order-payment-status">
                      <StatusPill label={paymentStatusLabels[order.paymentStatus as PaymentStatusValue]} />
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {order.createdAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-brand-500"
                        data-testid="admin-order-detail-link"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted">
                    目前沒有符合篩選條件的訂單。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
        <span>
          第 {result.page} / {result.totalPages} 頁，共 {result.totalCount} 筆
        </span>
        <div className="flex gap-2">
          <PaginationLink disabled={result.page <= 1} label="上一頁" params={params} page={result.page - 1} />
          <PaginationLink
            disabled={result.page >= result.totalPages}
            label="下一頁"
            params={params}
            page={result.page + 1}
          />
        </div>
      </div>
    </div>
  );
}

function parseFilters(params: Awaited<AdminOrdersPageProps["searchParams"]>): AdminOrderFilters {
  const parsedStatus = orderStatuses.includes(params.status as OrderStatusValue)
    ? (params.status as OrderStatusValue)
    : undefined;
  const parsedPaymentStatus = paymentStatuses.includes(params.paymentStatus as PaymentStatusValue)
    ? (params.paymentStatus as PaymentStatusValue)
    : undefined;

  return {
    keyword: params.keyword || undefined,
    status: parsedStatus,
    paymentStatus: parsedPaymentStatus,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    page: Number(params.page || 1),
    pageSize: 10
  };
}

function SelectField({
  label,
  name,
  value,
  options,
  testId
}: {
  label: string;
  name: string;
  value: string;
  options: Array<[string, string]>;
  testId: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        data-testid={testId}
      >
        <option value="">全部</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <input
        name={name}
        type="date"
        defaultValue={value}
        className="mt-2 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">
      {label}
    </span>
  );
}

function PaginationLink({
  disabled,
  label,
  params,
  page
}: {
  disabled: boolean;
  label: string;
  params: Awaited<AdminOrdersPageProps["searchParams"]>;
  page: number;
}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") {
      search.set(key, value);
    }
  }

  search.set("page", String(Math.max(1, page)));

  if (disabled) {
    return (
      <span className="rounded-full border border-line px-4 py-2 text-slate-300">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={`/admin/orders?${search.toString()}`}
      className="rounded-full border border-line px-4 py-2 font-semibold hover:border-brand-500"
    >
      {label}
    </Link>
  );
}

async function getAdminOrdersSafely(
  session: Awaited<ReturnType<typeof requireAdminSession>>,
  filters: AdminOrderFilters
) {
  try {
    return await getAdminOrders(session, filters);
  } catch {
    return {
      orders: [],
      totalCount: 0,
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalPages: 1
    };
  }
}
