import type {
  PaymentProvider,
  PaymentResult
} from "@/modules/payment/payment-provider";

export class NewebPayPaymentProvider implements PaymentProvider {
  readonly name = "newebpay";

  async createPayment(): Promise<PaymentResult> {
    throw new Error("NewebPay sandbox adapter is not implemented yet");
  }
}
