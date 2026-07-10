export type PaymentRequest = {
  orderId: string;
  amount: number;
  currency: string;
};

export type PaymentResult = {
  providerReference: string;
  status: "pending" | "paid" | "failed";
};

export interface PaymentProvider {
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
}
