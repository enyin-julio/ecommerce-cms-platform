import type {
  PaymentProvider,
  PaymentResult
} from "@/modules/payment/payment-provider";

export class LinePayPaymentProvider implements PaymentProvider {
  readonly name = "line-pay";

  async createPayment(): Promise<PaymentResult> {
    throw new Error("LINE Pay sandbox adapter is not implemented yet");
  }
}
