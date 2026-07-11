import type {
  PaymentProvider,
  PaymentResult
} from "@/modules/payment/payment-provider";

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createPayment(): Promise<PaymentResult> {
    throw new Error("Stripe sandbox adapter is not implemented yet");
  }
}
