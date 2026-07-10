import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";

export type AdminOrderFilters = {
  keyword?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export function buildAdminOrderWhere(session: AdminSession, filters: AdminOrderFilters = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (session.role === "merchant" && session.merchantId) {
    where.merchantId = session.merchantId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.keyword?.trim()) {
    const keyword = filters.keyword.trim();

    where.OR = [
      { id: { contains: keyword } },
      { customerName: { contains: keyword } },
      { customerPhone: { contains: keyword } },
      { customerEmail: { contains: keyword } }
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};

    if (filters.dateFrom) {
      where.createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    }

    if (filters.dateTo) {
      where.createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }
  }

  return where;
}

export async function getAdminOrders(session: AdminSession, filters: AdminOrderFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize || 10));
  const where = buildAdminOrderWhere(session, filters);
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        merchant: true,
        items: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize))
  };
}

export async function getAdminOrdersForExport(
  session: AdminSession,
  filters: Pick<AdminOrderFilters, "keyword" | "status" | "dateFrom" | "dateTo">
) {
  return prisma.order.findMany({
    where: buildAdminOrderWhere(session, filters),
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5000
  });
}

export async function getAdminOrderById(id: string, session: AdminSession) {
  return prisma.order.findFirst({
    where: {
      id,
      ...(session.role === "merchant" && session.merchantId
        ? { merchantId: session.merchantId }
        : {})
    },
    include: {
      merchant: true,
      items: {
        include: {
          product: true
        }
      },
      statusHistories: {
        include: {
          changedBy: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      stockMovements: {
        include: {
          product: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}
