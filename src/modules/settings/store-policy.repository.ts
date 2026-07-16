import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";
import { unstable_noStore as noStore } from "next/cache";

export async function getAdminStorePolicy(merchantId: string, session: AdminSession) {
  return prisma.storePolicy.findFirst({
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

export async function getPublicStorePolicy() {
  noStore();

  return prisma.storePolicy.findFirst({
    where: {
      merchant: {
        isActive: true
      }
    },
    include: {
      merchant: {
        include: {
          siteSetting: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
