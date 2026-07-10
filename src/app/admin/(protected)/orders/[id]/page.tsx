import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { OrderStatus as OrderStatusValue } from "@/lib/domain-types";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/actions";
import { formatCurrency } from "@/lib/format";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminOrderById } from "@/modules/orders/order.repository";
import {
  getAllowedNextOrderStatuses,
  getOrderStatusHint
} from "@/modules/orders/order-status.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "訂單詳情"
};

const statusLabels: Record<OrderStatusValue, string> = {
  pending: "未付款",
  unpaid: "未付款",
  paid: "已付款",
  processing: "處理中",
  shipped: "已出貨",
  cancelled: "已取消"
};

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const session = await requireAdminSession();
  const order = await getAdminOrderById(id, session);

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as { address?: string; phone?: string } | null;
  const orderStatus = order.status as OrderStatusValue;
  const nextStatuses = getAllowedNextOrderStatuses(orderStatus);
  const statusHint = getOrderStatusHint(orderStatus);

  return (
    <div className="space-y-6" data-testid="admin-order-detail-page">
      <div>
        <Link href="/admin/orders" className="text-sm font-semibold text-brand-700">
          返回訂單列表
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-ink">訂單詳情</h2>
        <p className="mt-2 font-mono text-xs text-muted" data-testid="admin-order-id">
          {order.id}
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">客戶資料</p>
          <h3 className="mt-2 font-semibold text-ink">{order.customerName}</h3>
          <p className="mt-1 text-sm text-muted">{order.customerEmail}</p>
          <p className="mt-1 text-sm text-muted">{order.customerPhone}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">配送資訊</p>
          <p className="mt-2 text-sm leading-6 text-ink">
            {shippingAddress?.address || "未填寫地址"}
          </p>
          {order.note ? <p className="mt-2 text-sm text-muted">備註：{order.note}</p> : null}
        </div>
        <form
          action={updateOrderStatusAction.bind(null, order.id)}
          className="rounded-lg border border-line bg-white p-5 shadow-sm"
          data-testid="admin-order-status-form"
        >
          <p className="text-sm font-medium text-muted">目前狀態</p>
          <p className="mt-2 text-lg font-bold text-ink" data-testid="admin-order-current-status">
            {statusLabels[orderStatus]}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{statusHint}</p>
          <select
            name="status"
            defaultValue={nextStatuses[0] || ""}
            disabled={nextStatuses.length === 0}
            className="mt-3 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100"
            data-testid="admin-order-status-select"
          >
            {nextStatuses.length === 0 ? <option value="">沒有可變更的狀態</option> : null}
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <input
            name="note"
            placeholder="狀態備註"
            disabled={nextStatuses.length === 0}
            className="mt-3 w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100"
            data-testid="admin-order-status-note"
          />
          <button
            type="submit"
            disabled={nextStatuses.length === 0}
            className="mt-3 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            data-testid="admin-order-status-submit"
          >
            更新狀態
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">商品</th>
                <th className="px-5 py-3 font-semibold">單價</th>
                <th className="px-5 py-3 font-semibold">數量</th>
                <th className="px-5 py-3 font-semibold">小計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-semibold text-ink">{item.productName}</td>
                  <td className="px-5 py-4 text-muted">
                    {formatCurrency(item.unitPrice.toString())}
                  </td>
                  <td className="px-5 py-4 text-muted">{item.quantity}</td>
                  <td className="px-5 py-4 font-semibold text-ink">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-5 text-right">
          <p className="text-sm text-muted">小計 {formatCurrency(order.subtotal.toString())}</p>
          <p className="mt-2 text-xl font-bold text-ink">
            總金額 {formatCurrency(order.total.toString())}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-ink">狀態異動紀錄</h3>
          <div className="mt-4 space-y-3" data-testid="admin-order-status-history">
            {order.statusHistories.length > 0 ? (
              order.statusHistories.map((history) => (
                <div key={history.id} className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-ink">
                    {history.previousStatus
                      ? statusLabels[history.previousStatus as OrderStatusValue]
                      : "建立訂單"}{" "}
                    -&gt; {statusLabels[history.nextStatus as OrderStatusValue]}
                  </p>
                  <p className="mt-1 text-muted">
                    {history.changedBy?.email || "系統"} &middot;{" "}
                    {history.createdAt.toLocaleString("zh-TW")}
                  </p>
                  {history.note ? <p className="mt-2 text-muted">{history.note}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">目前沒有狀態異動紀錄。</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-ink">庫存異動紀錄</h3>
          <div className="mt-4 space-y-3">
            {order.stockMovements.length > 0 ? (
              order.stockMovements.map((movement) => (
                <div key={movement.id} className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-ink">
                    {movement.product.name}: {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
                  </p>
                  <p className="mt-1 text-muted">
                    {movement.reason} &middot; {movement.createdAt.toLocaleString("zh-TW")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">目前沒有庫存異動紀錄。</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
