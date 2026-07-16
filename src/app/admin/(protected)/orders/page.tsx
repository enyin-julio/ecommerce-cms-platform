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
import { getDisplayOrderNumber } from "@/modules/orders/order-number";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訂單管理"
};

type AdminOrdersPageProps = {
  searchParams: Promise<{
    keyword?: string;
    status?: string;
    paymentStatus?: string;
    dateRange?: string;
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
  expired: "付款逾期",
  refunded: "已退款"
};

const dateRangeOptions = [
  ["1m", "近 1 個月"],
  ["3m", "近 3 個月"],
  ["6m", "近 6 個月"],
  ["12m", "近 1 年"],
  ["24m", "近 2 年"]
] as const;

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
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
          <Link href="/admin" className="hover:text-ink">
            總覽
          </Link>
          <span>/</span>
          <span>訂單管理</span>
          <span>/</span>
          <span className="text-ink">訂單總覽</span>
        </div>
        <h2 className="mt-5 text-3xl font-bold text-ink">訂單總覽</h2>
        <div className="mt-2 h-0.5 w-10 bg-amber-500" />
        <p className="mt-6 text-sm text-muted">
          可依關鍵字、日期區間、訂單狀態與付款狀態查詢訂單。系統只會顯示目前帳號有權限查看的資料。
        </p>
      </section>

      <form
        className="rounded-lg border border-line bg-white p-6 shadow-sm"
        data-testid="admin-orders-filter-form"
      >
        <h3 className="text-lg font-semibold text-ink">訂單查詢</h3>
        <p className="mt-2 text-sm text-muted">可單一條件或多條件進行篩選。</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,1.5fr)_auto]">
          <input
            name="keyword"
            defaultValue={filters.keyword || ""}
            placeholder="搜尋購買人、電話、Email、訂單編號"
            className="w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            data-testid="admin-orders-keyword"
          />
          <button
            type="submit"
            className="rounded-lg border border-line px-4 py-3 text-sm font-semibold hover:border-brand-500"
          >
            搜尋
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <SelectField
            label="日期範圍"
            name="dateRange"
            value={params.dateRange || ""}
            options={dateRangeOptions.map(([value, label]) => [value, label])}
            allLabel="自訂日期"
          />
          <SelectField
            label="訂單狀態"
            name="status"
            value={filters.status || ""}
            options={orderStatuses.map((status) => [status, statusLabels[status]])}
            allLabel="全部訂單狀態"
            testId="admin-orders-status-filter"
          />
          <SelectField
            label="付款狀態"
            name="paymentStatus"
            value={filters.paymentStatus || ""}
            options={paymentStatuses.map((status) => [status, paymentStatusLabels[status]])}
            allLabel="全部付款狀態"
            testId="admin-orders-payment-status-filter"
          />
          <div className="grid grid-cols-2 gap-2">
            <DateField label="開始" name="dateFrom" value={filters.dateFrom || ""} />
            <DateField label="結束" name="dateTo" value={filters.dateTo || ""} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            套用篩選
          </button>
          <Link
            href="/admin/orders"
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold hover:border-brand-500"
          >
            清除條件
          </Link>
        </div>
      </form>

      <section className="space-y-4">
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
              <p className="text-sm font-semibold text-ink">下載訂單資料</p>
              <p className="mt-1 text-sm text-muted">
                依目前篩選條件匯出 CSV，僅包含目前帳號有權限查看的訂單。
              </p>
            </div>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              data-testid="admin-orders-export-submit"
            >
              下載 CSV
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

        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">訂單編號</th>
                  <th className="px-5 py-3 font-semibold">訂單日期</th>
                  <th className="px-5 py-3 font-semibold">購買人</th>
                  <th className="px-5 py-3 font-semibold">總金額</th>
                  <th className="px-5 py-3 font-semibold">訂單狀態</th>
                  <th className="px-5 py-3 font-semibold">付款方式</th>
                  <th className="px-5 py-3 font-semibold">付款狀態</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.orders.length > 0 ? (
                  result.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50" data-testid="admin-order-row">
                      <td className="px-5 py-4 font-mono text-xs text-muted">
                        {getDisplayOrderNumber(order)}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {order.createdAt.toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">{order.customerName}</p>
                        <p className="mt-1 text-xs text-muted">{order.customerEmail}</p>
                        <p className="mt-1 text-xs text-muted">{order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatCurrency(order.total.toString())}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill label={statusLabels[order.status as OrderStatusValue]} />
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {order.paymentProvider || "尚未建立"}
                      </td>
                      <td className="px-5 py-4" data-testid="admin-order-payment-status">
                        <StatusPill label={paymentStatusLabels[order.paymentStatus as PaymentStatusValue]} />
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
                    <td colSpan={8} className="px-5 py-16 text-center text-muted">
                      無訂單資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
  const range = getDateRange(params.dateRange);

  return {
    keyword: params.keyword || undefined,
    status: parsedStatus,
    paymentStatus: parsedPaymentStatus,
    dateFrom: params.dateFrom || range?.dateFrom,
    dateTo: params.dateTo || range?.dateTo,
    page: Number(params.page || 1),
    pageSize: 10
  };
}

function getDateRange(value: string | undefined) {
  const months = value === "1m" ? 1 : value === "3m" ? 3 : value === "6m" ? 6 : value === "12m" ? 12 : value === "24m" ? 24 : null;

  if (!months) {
    return null;
  }

  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);

  return {
    dateFrom: toDateInputValue(dateFrom),
    dateTo: toDateInputValue(dateTo)
  };
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function SelectField({
  label,
  name,
  value,
  options,
  allLabel,
  testId
}: {
  label: string;
  name: string;
  value: string;
  options: Array<[string, string]>;
  allLabel: string;
  testId?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        data-testid={testId}
      >
        <option value="">{allLabel}</option>
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
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <input
        name={name}
        type="date"
        defaultValue={value}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
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
