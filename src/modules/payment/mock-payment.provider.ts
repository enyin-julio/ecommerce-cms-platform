import type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult
} from "@/modules/payment/payment-provider";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const mode = request.mode || "success";
    const providerReference = `mock_${request.orderId}_${Date.now()}`;

    if (mode === "failed") {
      return {
        provider: this.name,
        providerReference,
        status: "failed",
        message: "Mock payment failed"
      };
    }

    if (mode === "pending") {
      return {
        provider: this.name,
        providerReference,
        status: "pending",
        message: "Mock payment pending"
      };
    }

    return {
      provider: this.name,
      providerReference,
      status: "paid",
      paidAt: new Date(),
      message: "Mock payment paid"
    };
  }
}
