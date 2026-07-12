export type EcpayRuntimeConfig = {
  mode: "sandbox" | "production";
  merchantId: string;
  hashKey: string;
  hashIv: string;
  returnUrl: string;
  clientBackUrl?: string;
  orderResultUrl?: string;
  refundNotifyUrl?: string;
};

const unsafeProductionValues = new Set(["", "default", "changeme", "test", "demo", "secret", "123456"]);

export function getEcpayRuntimeConfig(options: { requireReturnUrl?: boolean } = {}) {
  const mode = process.env.PAYMENT_MODE === "production" ? "production" : "sandbox";

  if (mode === "production" && process.env.ENABLE_ECPAY_PRODUCTION !== "true") {
    throw new Error("ECPay production is not enabled");
  }

  const merchantId = process.env.ECPAY_MERCHANT_ID || "";
  const hashKey = process.env.ECPAY_HASH_KEY || "";
  const hashIv = process.env.ECPAY_HASH_IV || "";
  const returnUrl = process.env.ECPAY_RETURN_URL || "";

  if (!isSafeConfiguredValue(merchantId) || !isSafeConfiguredValue(hashKey) || !isSafeConfiguredValue(hashIv)) {
    throw new Error("ECPay environment variables are not configured");
  }

  if (options.requireReturnUrl !== false && !returnUrl) {
    throw new Error("ECPay return URL is not configured");
  }

  return {
    mode,
    merchantId,
    hashKey,
    hashIv,
    returnUrl,
    clientBackUrl: process.env.ECPAY_CLIENT_BACK_URL || undefined,
    orderResultUrl: process.env.ECPAY_ORDER_RESULT_URL || undefined,
    refundNotifyUrl: process.env.ECPAY_REFUND_NOTIFY_URL || undefined
  } satisfies EcpayRuntimeConfig;
}

export function assertEcpaySandboxOnly(operation: string) {
  const mode = process.env.PAYMENT_MODE === "production" ? "production" : "sandbox";

  if (mode === "production" || process.env.ENABLE_ECPAY_PRODUCTION === "true") {
    throw new Error(`${operation} is not enabled for ECPay production mode`);
  }
}

export function assertEcpayProductionAllowed(operation: string) {
  const mode = process.env.PAYMENT_MODE === "production" ? "production" : "sandbox";

  if (mode === "production" && process.env.ENABLE_ECPAY_PRODUCTION !== "true") {
    throw new Error(`${operation} is blocked because ECPay production is not enabled`);
  }
}

function isSafeConfiguredValue(value: string) {
  return !unsafeProductionValues.has(value.trim().toLowerCase());
}
