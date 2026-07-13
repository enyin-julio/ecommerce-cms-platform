import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";
import { unstable_noStore as noStore } from "next/cache";

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

export async function getPublicSiteSetting() {
  noStore();

  return prisma.siteSetting.findFirst({
    include: {
      merchant: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
