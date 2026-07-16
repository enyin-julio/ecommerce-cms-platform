import type { Prisma } from "@prisma/client";

type OrderNumberClient = Pick<Prisma.TransactionClient, "order" | "merchant">;

export function getDisplayOrderNumber(order: { id: string; orderNumber?: string | null }) {
  return order.orderNumber || order.id;
}

export async function createOrderNumber(
  tx: OrderNumberClient,
  merchantId: string,
  createdAt = new Date()
) {
  const merchant = await tx.merchant.findUnique({
    where: {
      id: merchantId
    },
    select: {
      slug: true,
      name: true
    }
  });
  const prefix = getMerchantOrderPrefix(merchant?.slug || merchant?.name || "UZ");
  const taipeiDate = getTaipeiDateParts(createdAt);
  const datePart = formatOrderDate(taipeiDate);
  const { dayStart, dayEnd } = getTaipeiDayBounds(taipeiDate);
  const existingTodayCount = await tx.order.count({
    where: {
      merchantId,
      createdAt: {
        gte: dayStart,
        lte: dayEnd
      }
    }
  });

  for (let sequence = existingTodayCount + 1; sequence < existingTodayCount + 1000; sequence += 1) {
    const orderNumber = `${prefix}${datePart}${String(sequence).padStart(4, "0")}`;
    const existingOrder = await tx.order.findUnique({
      where: {
        orderNumber
      },
      select: {
        id: true
      }
    });

    if (!existingOrder) {
      return orderNumber;
    }
  }

  throw new Error("Unable to generate order number");
}

function getMerchantOrderPrefix(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return (normalized || "UZ").slice(0, 2).padEnd(2, "X");
}

function getTaipeiDateParts(date: Date) {
  const taipeiDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  return {
    year: taipeiDate.getUTCFullYear(),
    month: taipeiDate.getUTCMonth() + 1,
    day: taipeiDate.getUTCDate()
  };
}

function getTaipeiDayBounds(date: { year: number; month: number; day: number }) {
  const dayStart = new Date(Date.UTC(date.year, date.month - 1, date.day) - 8 * 60 * 60 * 1000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {
    dayStart,
    dayEnd
  };
}

function formatOrderDate(date: { year: number; month: number; day: number }) {
  const year = date.year;
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");

  return `${year}${month}${day}`;
}
