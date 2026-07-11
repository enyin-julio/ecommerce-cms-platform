import { NextResponse } from "next/server";
import { processEcpayWebhook } from "@/modules/payment/ecpay-webhook.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  );

  try {
    await processEcpayWebhook(payload);

    return new NextResponse("1|OK", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  } catch {
    return new NextResponse("0|Error", {
      status: 400,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }
}
