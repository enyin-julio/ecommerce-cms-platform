import { NextResponse } from "next/server";
import { buildEcpayCheckMacValue } from "@/modules/payment/ecpay-check-mac";
import { encryptEcpayData } from "@/modules/payment/ecpay-data-crypto";
import { getEcpayRuntimeConfig } from "@/modules/payment/ecpay-env";
import { processEcpayRefundWebhook } from "@/modules/payment/ecpay-refund.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  try {
    await processEcpayRefundWebhook(payload);

    return NextResponse.json(buildRefundNotifyResponse(payload, 1, "成功"));
  } catch {
    return NextResponse.json(buildRefundNotifyResponse(payload, 0, "Error"), { status: 400 });
  }
}

function buildRefundNotifyResponse(
  requestPayload: Record<string, unknown>,
  rtnCode: 0 | 1,
  rtnMsg: string
) {
  const config = getEcpayRuntimeConfig({ requireReturnUrl: false });
  const response: Record<string, unknown> = {
    ...(typeof requestPayload.PlatformID === "string" ? { PlatformID: requestPayload.PlatformID } : {}),
    MerchantID: config.merchantId,
    RpHeader: {
      Timestamp: Math.floor(Date.now() / 1000)
    },
    TransCode: rtnCode,
    TransMsg: rtnMsg,
    Data: encryptEcpayData(
      {
        RtnCode: rtnCode,
        RtnMsg: rtnMsg
      },
      config.hashKey,
      config.hashIv
    )
  };

  response.CheckMacValue = buildEcpayCheckMacValue(response, config.hashKey, config.hashIv);

  return response;
}
