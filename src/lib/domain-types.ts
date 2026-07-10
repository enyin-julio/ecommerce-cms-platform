export const UserRole = {
  admin: "admin",
  merchant: "merchant",
  customer: "customer"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PageType = {
  brand: "brand",
  landing: "landing",
  content: "content"
} as const;

export type PageType = (typeof PageType)[keyof typeof PageType];

export const OrderStatus = {
  pending: "pending",
  unpaid: "unpaid",
  paid: "paid",
  processing: "processing",
  shipped: "shipped",
  cancelled: "cancelled"
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

