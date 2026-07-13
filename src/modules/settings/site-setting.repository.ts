import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";

export async function getAdminSiteSetting(merchantId: string, session: AdminSession) {
  return prisma.siteSetting.findFirst({
    where: {
      merchantId,
      ...(session.role === "merchant" && session.merchantId
        ? { merchantId: session.merchantId }
        : {})
    },
    include: {
      merchant: true
    }
  });
}
