import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyEcpayCheckMacValue } from "@/modules/payment/ecpay-check-mac";

export type EcpayWebhookPayload = Record<string, string>;

export async function processEcpayWebhook(payload: EcpayWebhookPayload) {
  const log = await prisma.paymentWebhookLog.create({
    data: {
      provider: "ecpay",
      merchantTradeNo: payload.MerchantTradeNo || null,
      eventType: "payment_callback",
      requestPayload: payload as Prisma.InputJsonObject
    }
  });

  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;

  try {
    if (!hashKey || !hashIv) {
      throw new Error("ECPay webhook secret is not configured");
    }

    if (!verifyEcpayCheckMacValue(payload, hashKey, hashIv)) {
      throw new Error("Invalid ECPay CheckMacValue");
    }

    await markWebhookLog(log.id, {
      isValidSignature: true,
      processingStatus: "verified",
      processingMessage: "CheckMacValue verified"
    });

    const merchantTradeNo = payload.MerchantTradeNo;
    const callbackAmount = Number(payload.TradeAmt || payload.TotalAmount || 0);

    if (!merchantTradeNo || !Number.isFinite(callbackAmount)) {
      throw new Error("Invalid ECPay webhook payload");
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          merchantTradeNo
        },
        include: {
          order: true
        }
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      const orderAmount = Math.round(Number(payment.order.total));

      if (callbackAmount !== orderAmount) {
        throw new Error("ECPay webhook amount mismatch");
      }

      const isSuccess = payload.RtnCode === "1";
      const paidAt = parseEcpayDate(payload.PaymentDate) || new Date();
      const transactionId = payload.TradeNo || null;
      const rawPayload = payload as Prisma.InputJsonObject;

      await tx.paymentWebhookLog.update({
        where: {
          id: log.id
        },
        data: {
          paymentId: payment.id
        }
      });

      if (payment.status === "paid" && payment.order.paymentStatus === "paid") {
        return {
          status: "already_processed" as const,
          orderId: payment.orderId,
          paymentId: payment.id
        };
      }

      if (!isSuccess) {
        const failedStatus = resolveFailedPaymentStatus(payload.RtnMsg);

        if (payment.status !== "paid") {
          await tx.payment.update({
            where: {
              id: payment.id
            },
            data: {
              status: failedStatus,
              transactionId,
              rawPayload,
              failureReason: payload.RtnMsg || "ECPay payment failed"
            }
          });

          await tx.order.update({
            where: {
              id: payment.orderId
            },
            data: {
              paymentStatus: failedStatus,
              paymentProvider: "ecpay",
              paymentTransactionId: transactionId
            }
          });
        }

        return {
          status: failedStatus,
          orderId: payment.orderId,
          paymentId: payment.id
        };
      }

      await tx.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: "paid",
          transactionId,
          rawPayload,
          paidAt
        }
      });

      const shouldWriteStatusHistory = payment.order.status !== "paid";

      await tx.order.update({
        where: {
          id: payment.orderId
        },
        data: {
          status: "paid",
          paymentStatus: "paid",
          paymentProvider: "ecpay",
          paymentTransactionId: transactionId,
          paidAt
        }
      });

      if (shouldWriteStatusHistory) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            previousStatus: payment.order.status,
            nextStatus: "paid",
            note: "ECPay Sandbox webhook payment succeeded"
          }
        });
      }

      return {
        status: "paid" as const,
        orderId: payment.orderId,
        paymentId: payment.id
      };
    });

    await markWebhookLog(log.id, {
      processingStatus: result.status,
      processingMessage: `Order ${result.orderId} updated from ECPay webhook`,
      responsePayload: result
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ECPay webhook error";

    await markWebhookLog(log.id, {
      processingStatus: "failed",
      processingMessage: message
    });

    throw error;
  }
}

function parseEcpayDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.replace(/\//g, "-"));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveFailedPaymentStatus(message?: string) {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("cancel") || normalized.includes("取消")) {
    return "cancelled" as const;
  }

  if (normalized.includes("expire") || normalized.includes("逾時") || normalized.includes("逾期")) {
    return "expired" as const;
  }

  return "failed" as const;
}

async function markWebhookLog(
  id: string,
  data: {
    isValidSignature?: boolean;
    processingStatus: string;
    processingMessage?: string;
    responsePayload?: Prisma.InputJsonValue;
  }
) {
  await prisma.paymentWebhookLog.update({
    where: {
      id
    },
    data: {
      isValidSignature: data.isValidSignature,
      processingStatus: data.processingStatus,
      processingMessage: data.processingMessage,
      responsePayload: data.responsePayload,
      processedAt: new Date()
    }
  });
}
