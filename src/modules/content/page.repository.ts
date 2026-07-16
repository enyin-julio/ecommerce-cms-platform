import { prisma } from "@/lib/prisma";
import type { PageType } from "@/lib/domain-types";
import type { AdminSession } from "@/lib/session-token";
import { unstable_noStore as noStore } from "next/cache";

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
      merchant: {
        isActive: true
      },
      ...(type ? { type } : {})
    },
    include: {
      merchant: true
    }
  });
}

export async function getPublishedBrandPage() {
  noStore();

  return prisma.page.findFirst({
    where: {
      type: "brand",
      isPublished: true,
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
}

export async function getPublishedNavigationPages() {
  noStore();

  return prisma.page.findMany({
    where: {
      isPublished: true,
      showInNavigation: true,
      merchant: {
        isActive: true
      }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      heroImageUrl: true,
      heroSubtitle: true,
      navigationGroup: true,
      navigationOrder: true
    },
    orderBy: [
      {
        navigationGroup: "asc"
      },
      {
        navigationOrder: "asc"
      },
      {
        updatedAt: "desc"
      }
    ],
    take: 30
  });
}
