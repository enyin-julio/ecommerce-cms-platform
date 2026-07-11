import type { PaymentProvider } from "@/modules/payment/payment-provider";
import { EcpayPaymentProvider } from "@/modules/payment/adapters/ecpay.provider";
import { MockPaymentProvider } from "@/modules/payment/mock-payment.provider";

export type PaymentProviderName =
  | "mock"
  | "stripe"
  | "ecpay"
  | "newebpay"
  | "line-pay";

export function getPaymentProvider(name?: string): PaymentProvider {
  const providerName = (name || process.env.PAYMENT_PROVIDER || "mock").toLowerCase();

  switch (providerName) {
    case "mock":
      return new MockPaymentProvider();
    case "ecpay":
      return new EcpayPaymentProvider();
    case "stripe":
    case "newebpay":
    case "line-pay":
      throw new Error(`${providerName} payment provider is not enabled yet`);
    default:
      return new MockPaymentProvider();
  }
}
