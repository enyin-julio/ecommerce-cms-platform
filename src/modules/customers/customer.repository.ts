import { prisma } from "@/lib/prisma";

export async function getCustomerById(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "customer"
    }
  });
}

export async function getCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: {
      userId
    },
    include: {
      items: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getCustomerOrderById(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: {
      items: true
    }
  });
}

export async function getGuestOrderByEmail(orderId: string, email: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerEmail: email.toLowerCase(),
      userId: null
    },
    include: {
      items: true
    }
  });
}
