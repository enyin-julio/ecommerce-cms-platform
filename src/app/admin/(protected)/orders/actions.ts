"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, denyAccess, requireAdminSession } from "@/lib/rbac";
import { canTransitionOrderStatus } from "@/modules/orders/order-status.service";

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional()
});

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = statusSchema.parse({
    status: formData.get("status"),
    note: formData.get("note") || undefined
  });

  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
    include: {
      items: true
    }
  });

  if (!order) {
    denyAccess();
  }

  assertMerchantAccess(session, order.merchantId);

  if (order.status === data.status) {
    return;
  }

  if (!canTransitionOrderStatus(order.status as OrderStatus, data.status)) {
    denyAccess();
  }

  await prisma.$transaction(async (tx) => {
    if (data.status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (!item.productId) {
          continue;
        }

        await tx.product.update({
          where: {
            id: item.productId
          },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            orderId: order.id,
            quantity: item.quantity,
            reason: "order_cancelled"
          }
        });
      }
    }

    await tx.order.update({
      where: {
        id: order.id
      },
      data: {
        status: data.status
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.status,
        nextStatus: data.status,
        changedById: session.userId,
        note: data.note || null
      }
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
}
