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
      return "待付款可改為已付款或已取消。";
    case OrderStatus.paid:
      return "已付款可改為處理中或已取消。";
    case OrderStatus.processing:
      return "處理中可改為已出貨或已取消。";
    case OrderStatus.shipped:
      return "已出貨為最終狀態，不可回退。";
    case OrderStatus.cancelled:
      return "已取消為最終狀態，不可再變更。";
    case OrderStatus.unpaid:
      return "未付款可改為已付款或已取消。";
    default:
      return "目前沒有可用的狀態變更。";
  }
}
