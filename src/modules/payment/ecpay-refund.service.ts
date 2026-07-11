import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertEcpayProductionAllowed, getEcpayRuntimeConfig } from "@/modules/payment/ecpay-env";
import { verifyEcpayCheckMacValue } from "@/modules/payment/ecpay-check-mac";
import { decryptEcpayData, encryptEcpayData } from "@/modules/payment/ecpay-data-crypto";

type CreateRefundInput = {
  orderId: string;
  amount: number;
  reason?: string;
  requestedById: string;
};

export async function createEcpaySandboxRefund(input: CreateRefundInput) {
  assertEcpayProductionAllowed("ECPay refund");

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: input.orderId
    },
    include: {
      payments: {
        where: {
          provider: "ecpay",
          status: "paid"
        },
        orderBy: {
          paidAt: "desc"
        }
      },
      refunds: true
    }
  });

  if (!order || order.paymentStatus !== "paid") {
    throw new Error("Only paid orders can be refunded");
  }

  const payment = order.payments[0];

  if (!payment) {
    throw new Error("Paid ECPay payment record was not found");
  }

  const paidAmount = Number(payment.amount);
  const refundedAmount = order.refunds
    .filter((refund) => refund.status === "requested" || refund.status === "processing" || refund.status === "succeeded")
    .reduce((sum, refund) => sum + Number(refund.amount), 0);

  if (refundedAmount + input.amount > paidAmount) {
    throw new Error("Refund amount exceeds paid amount");
  }

  const config = getEcpayRuntimeConfig({ requireReturnUrl: false });
  const merchantRefundNo = createMerchantRefundNo();
  const refundData = {
    MerchantID: config.merchantId,
    MerchantTradeNo: payment.merchantTradeNo,
    MerchantRefundNo: merchantRefundNo,
    RefundAmount: Math.round(input.amount),
    RefundReason: encodeURIComponent(input.reason || "refund"),
    ...(config.refundNotifyUrl ? { NotifyURL: encodeURIComponent(config.refundNotifyUrl) } : {})
  };
  const requestPayload = {
    MerchantID: config.merchantId,
    RqHeader: {
      Timestamp: Math.floor(Date.now() / 1000)
    },
    Data: encryptEcpayData(refundData, config.hashKey, config.hashIv)
  };

  const refund = await prisma.paymentRefund.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      status: "processing",
      amount: new Prisma.Decimal(input.amount),
      reason: input.reason || null,
      provider: "ecpay",
      providerRefundId: merchantRefundNo,
      requestedById: input.requestedById,
      requestPayload: sanitizeRefundPayload(requestPayload)
    }
  });

  if (config.mode === "sandbox" && process.env.ECPAY_REFUND_API_ENABLED !== "true") {
    return prisma.paymentRefund.update({
      where: {
        id: refund.id
      },
      data: {
        status: "requested",
        responsePayload: {
          mode: "sandbox",
          message: "Refund request recorded. Set ECPAY_REFUND_API_ENABLED=true to call the ECPay sandbox refund API."
        }
      }
    });
  }

  const endpoint =
    config.mode === "production"
      ? "https://ecpayment.ecpay.com.tw/1.0.0/Cashier/Refund"
      : "https://ecpayment-stage.ecpay.com.tw/1.0.0/Cashier/Refund";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(requestPayload)
  });
  const providerResponse = (await response.json()) as Record<string, unknown>;
  const responseData =
    typeof providerResponse.Data === "string"
      ? decryptEcpayData(providerResponse.Data, config.hashKey, config.hashIv)
      : null;
  const succeeded = providerResponse.TransCode === 1 && responseData?.RtnCode === 1;

  return prisma.paymentRefund.update({
    where: {
      id: refund.id
    },
    data: {
      status: succeeded ? "processing" : "failed",
      responsePayload: {
        ...providerResponse,
        Data: responseData
      } as Prisma.InputJsonObject
    }
  });
}

export async function processEcpayRefundWebhook(payload: Record<string, unknown>) {
  const config = getEcpayRuntimeConfig({ requireReturnUrl: false });
  const log = await prisma.paymentWebhookLog.create({
    data: {
      provider: "ecpay",
      merchantTradeNo: extractRefundMerchantTradeNo(payload),
      eventType: "refund_callback",
      requestPayload: payload as Prisma.InputJsonObject
    }
  });

  try {
    if (!verifyEcpayCheckMacValue(payload, config.hashKey, config.hashIv)) {
      throw new Error("Invalid ECPay refund CheckMacValue");
    }

    const data = parseRefundData(payload.Data, config.hashKey, config.hashIv);
    const merchantTradeNo =
      typeof data.MerchantTradeNo === "string" ? data.MerchantTradeNo : "";
    const refundAmount = Number(data.RefundAmount || 0);

    if (!merchantTradeNo || !Number.isFinite(refundAmount) || refundAmount <= 0) {
      throw new Error("Invalid ECPay refund webhook payload");
    }

    const result = await prisma.$transaction(async (tx) => {
      const merchantRefundNo =
        typeof data.MerchantRefundNo === "string" ? data.MerchantRefundNo : "";
      const payment = await tx.payment.findUnique({
        where: {
          merchantTradeNo
        },
        include: {
          refunds: {
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      });

      if (!payment) {
        throw new Error("Payment not found for refund webhook");
      }

      const refund =
        payment.refunds.find((item) => item.providerRefundId === merchantRefundNo) ||
        payment.refunds.find((item) => Number(item.amount) === refundAmount && item.status !== "succeeded") ||
        payment.refunds[0];

      if (!refund) {
        throw new Error("Refund record not found");
      }

      await tx.paymentWebhookLog.update({
        where: {
          id: log.id
        },
        data: {
          paymentId: payment.id,
          merchantTradeNo
        }
      });

      if (refund.status === "succeeded") {
        return {
          status: "already_processed" as const,
          refundId: refund.id,
          paymentId: payment.id
        };
      }

      const updatedRefund = await tx.paymentRefund.update({
        where: {
          id: refund.id
        },
        data: {
          status: "succeeded",
          providerRefundId: merchantRefundNo || refund.providerRefundId,
          responsePayload: {
            ...payload,
            Data: data
          } as Prisma.InputJsonObject,
          processedAt: new Date()
        }
      });

      await tx.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: Number(updatedRefund.amount) >= Number(payment.amount) ? "refunded" : payment.status
        }
      });

      return {
        status: "succeeded" as const,
        refundId: refund.id,
        paymentId: payment.id
      };
    });

    await prisma.paymentWebhookLog.update({
      where: {
        id: log.id
      },
      data: {
        isValidSignature: true,
        processingStatus: result.status,
        processingMessage: `Refund ${result.refundId} updated from ECPay refund webhook`,
        responsePayload: result,
        processedAt: new Date()
      }
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ECPay refund webhook error";

    await prisma.paymentWebhookLog.update({
      where: {
        id: log.id
      },
      data: {
        processingStatus: "failed",
        processingMessage: message,
        processedAt: new Date()
      }
    });

    throw error;
  }
}

function parseRefundData(value: unknown, hashKey: string, hashIv: string) {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string" && value.trim().startsWith("{")) {
    return JSON.parse(value) as Record<string, unknown>;
  }

  if (typeof value === "string") {
    return decryptEcpayData(value, hashKey, hashIv);
  }

  throw new Error("Invalid ECPay refund Data payload");
}

function extractRefundMerchantTradeNo(payload: Record<string, unknown>) {
  try {
    const hashKey = process.env.ECPAY_HASH_KEY || "";
    const hashIv = process.env.ECPAY_HASH_IV || "";
    const data =
      hashKey && hashIv
        ? parseRefundData(payload.Data, hashKey, hashIv)
        : typeof payload.Data === "object" && payload.Data !== null && !Array.isArray(payload.Data)
          ? (payload.Data as Record<string, unknown>)
          : {};

    return typeof data.MerchantTradeNo === "string" ? data.MerchantTradeNo : null;
  } catch {
    return null;
  }
}

function createMerchantRefundNo() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  return `RF${timestamp}${random}`.slice(0, 20);
}

function sanitizeRefundPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    Data: "[encrypted]"
  } satisfies Prisma.InputJsonObject;
}
