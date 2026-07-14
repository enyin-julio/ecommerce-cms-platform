import { OrderStatus, PaymentStatus } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";

function getMerchantWhere(session: AdminSession) {
  return session.role === "merchant" && session.merchantId
    ? { merchantId: session.merchantId }
    : {};
}

export async function getAdminDashboardData(session: AdminSession) {
  const merchantWhere = getMerchantWhere(session);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    siteSetting,
    merchants,
    todayOrderTotal,
    todayOrderCount,
    unpaidOrderCount,
    pendingOrderCount,
    publishedProductCount,
    publishedPageCount,
    mediaCount,
    recentOrders,
    recentProducts,
    recentPages
  ] = await Promise.all([
    prisma.siteSetting.findFirst({
      where: merchantWhere,
      include: {
        merchant: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),
    prisma.merchant.findMany({
      where:
        session.role === "merchant" && session.merchantId
          ? { id: session.merchantId }
          : undefined,
      orderBy: {
        updatedAt: "desc"
      },
      take: 5
    }),
    prisma.order.aggregate({
      where: {
        ...merchantWhere,
        createdAt: {
          gte: today
        }
      },
      _sum: {
        total: true
      }
    }),
    prisma.order.count({
      where: {
        ...merchantWhere,
        createdAt: {
          gte: today
        }
      }
    }),
    prisma.order.count({
      where: {
        ...merchantWhere,
        paymentStatus: {
          in: [PaymentStatus.unpaid, PaymentStatus.pending]
        }
      }
    }),
    prisma.order.count({
      where: {
        ...merchantWhere,
        status: {
          in: [OrderStatus.pending, OrderStatus.processing]
        }
      }
    }),
    prisma.product.count({
      where: {
        ...merchantWhere,
        isPublished: true
      }
    }),
    prisma.page.count({
      where: {
        ...merchantWhere,
        isPublished: true
      }
    }),
    prisma.media.count({
      where: merchantWhere
    }),
    prisma.order.findMany({
      where: merchantWhere,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        customerName: true,
        total: true,
        createdAt: true
      },
      take: 3
    }),
    prisma.product.findMany({
      where: merchantWhere,
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        name: true,
        updatedAt: true
      },
      take: 3
    }),
    prisma.page.findMany({
      where: merchantWhere,
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        title: true,
        updatedAt: true
      },
      take: 3
    })
  ]);

  return {
    siteSetting,
    primaryMerchant: siteSetting?.merchant || merchants[0] || null,
    merchants,
    todayOrderTotal: todayOrderTotal._sum.total,
    todayOrderCount,
    unpaidOrderCount,
    pendingOrderCount,
    publishedProductCount,
    publishedPageCount,
    mediaCount,
    recentOrders,
    recentProducts,
    recentPages
  };
}
