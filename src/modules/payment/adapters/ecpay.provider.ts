import type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult
} from "@/modules/payment/payment-provider";
import { buildEcpayCheckMacValue } from "@/modules/payment/ecpay-check-mac";
import { getEcpayRuntimeConfig } from "@/modules/payment/ecpay-env";

export class EcpayPaymentProvider implements PaymentProvider {
  readonly name = "ecpay";

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const config = getEcpayRuntimeConfig();

    const merchantTradeNo = request.merchantTradeNo;

    if (!merchantTradeNo) {
      throw new Error("ECPay merchant trade number is required");
    }

    const formFields: Record<string, string> = {
      MerchantID: config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: formatEcpayDate(new Date()),
      PaymentType: "aio",
      TotalAmount: String(Math.round(request.amount)),
      TradeDesc: `Order ${request.orderId}`,
      ItemName: request.itemName || `Order ${request.orderId}`,
      ReturnURL: config.returnUrl,
      ChoosePayment: "ALL",
      EncryptType: "1"
    };

    if (config.clientBackUrl) {
      formFields.ClientBackURL = config.clientBackUrl;
    }

    if (config.orderResultUrl) {
      formFields.OrderResultURL = config.orderResultUrl;
    }

    formFields.CheckMacValue = buildEcpayCheckMacValue(formFields, config.hashKey, config.hashIv);

    return {
      provider: this.name,
      providerReference: merchantTradeNo,
      status: "pending",
      actionUrl:
        config.mode === "sandbox"
          ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
          : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
      formFields,
      message: "ECPay sandbox payment initialized"
    };
  }
}

function formatEcpayDate(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";

  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}
