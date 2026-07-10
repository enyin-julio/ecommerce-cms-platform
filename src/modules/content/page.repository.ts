import { prisma } from "@/lib/prisma";
import type { PageType } from "@/lib/domain-types";
import type { AdminSession } from "@/lib/session-token";

export async function getAdminPages(session: AdminSession) {
  return prisma.page.findMany({
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
      updatedAt: "desc"
    },
    take: 100
  });
}

export async function getAdminPageById(id: string, session: AdminSession) {
  return prisma.page.findFirst({
    where: {
      id,
      ...(session.role === "merchant" && session.merchantId
        ? { merchantId: session.merchantId }
        : {})
    },
    include: {
      merchant: true
    }
  });
}

export async function getPublishedPageBySlug(slug: string, type?: PageType) {
  return prisma.page.findFirst({
    where: {
      slug,
      isPublished: true,
      ...(type ? { type } : {})
    },
    include: {
      merchant: true
    }
  });
}
