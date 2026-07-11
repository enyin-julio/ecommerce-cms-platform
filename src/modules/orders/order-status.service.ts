import { OrderStatus, type OrderStatus as OrderStatusValue } from "@/lib/domain-types";

const allowedTransitions: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: [OrderStatus.paid, OrderStatus.cancelled],
  unpaid: [OrderStatus.paid, OrderStatus.cancelled],
  paid: [OrderStatus.processing, OrderStatus.cancelled],
  processing: [OrderStatus.shipped, OrderStatus.cancelled],
  shipped: [],
  cancelled: []
};

export function getAllowedNextOrderStatuses(status: OrderStatusValue) {
  return allowedTransitions[status] || [];
}

export function canTransitionOrderStatus(from: OrderStatusValue, to: OrderStatusValue) {
  return getAllowedNextOrderStatuses(from).includes(to);
}

export function getOrderStatusHint(status: OrderStatusValue) {
  switch (status) {
    case OrderStatus.pending:
      return "待處理訂單可改為已付款或已取消。";
    case OrderStatus.unpaid:
      return "未付款訂單可改為已付款或已取消。";
    case OrderStatus.paid:
      return "已付款訂單可改為處理中或已取消。";
    case OrderStatus.processing:
      return "處理中訂單可改為已出貨或已取消。";
    case OrderStatus.shipped:
      return "已出貨訂單不可回退到前面狀態。";
    case OrderStatus.cancelled:
      return "已取消訂單不可再變更狀態。";
    default:
      return "目前沒有可用的狀態操作。";
  }
}
