export type PaymentRequest = {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  merchantTradeNo?: string;
  itemName?: string;
  mode?: "success" | "failed" | "pending";
};

export type PaymentResult = {
  provider: string;
  providerReference: string;
  status: "pending" | "paid" | "failed";
  actionUrl?: string;
  formFields?: Record<string, string>;
  paidAt?: Date;
  message?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
}
