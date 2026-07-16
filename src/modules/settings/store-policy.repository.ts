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

  const publicSiteSetting = await prisma.siteSetting.findFirst({
    where: {
      merchant: {
        isActive: true
      }
    },
    include: {
      merchant: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!publicSiteSetting) {
    return null;
  }

  return prisma.storePolicy.findUnique({
    where: {
      merchantId: publicSiteSetting.merchantId
    },
    include: {
      merchant: {
        include: {
          siteSetting: true
        }
      }
    },
  });
}

export async function getPublicStorePolicyMerchantId() {
  noStore();

  const publicSiteSetting = await prisma.siteSetting.findFirst({
    where: {
      merchant: {
        isActive: true
      }
    },
    select: {
      merchantId: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return publicSiteSetting?.merchantId || null;
}
