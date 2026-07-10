import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";

export async function getAdminMedia(session: AdminSession) {
  return prisma.media.findMany({
    where:
      session.role === "merchant" && session.merchantId
        ? {
            merchantId: session.merchantId
          }
        : undefined,
    include: {
      merchant: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}
