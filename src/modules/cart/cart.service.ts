import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/modules/payment/payment-provider.factory";

export const CART_COOKIE_NAME = "commerce_cart_id";

export async function getCartCookieId() {
  const cookieStore = await cookies();

  return cookieStore.get(CART_COOKIE_NAME)?.value || null;
}

export async function setCartCookie(cartId: string) {
  const cookieStore = await cookies();

  cookieStore.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearCartCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(CART_COOKIE_NAME);
}

export async function getCurrentCart() {
  const cartId = await getCartCookieId();

  if (!cartId) {
    return null;
  }

  return prisma.cart.findUnique({
    where: {
      id: cartId
    },
    include: {
      merchant: true,
      items: {
        include: {
          product: true
        },
        orderBy: {
          id: "asc"
        }
      }
    }
  });
}

export function calculateCartTotals(
  cart: NonNullable<Awaited<ReturnType<typeof getCurrentCart>>>
) {
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  return {
    subtotal,
    total: subtotal
  };
}

export async function addProductToCart(productId: string, quantity: number) {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isPublished: true
    }
  });

  if (!product || product.stock < 1) {
    throw new Error("Product is unavailable");
  }

  const cartId = await getCartCookieId();
  const existingCart = cartId
    ? await prisma.cart.findUnique({
        where: {
          id: cartId
        }
      })
    : null;

  const cart =
    existingCart && existingCart.merchantId === product.merchantId
      ? existingCart
      : await prisma.cart.create({
          data: {
            merchantId: product.merchantId,
            sessionId: crypto.randomUUID()
          }
        });

  await setCartCookie(cart.id);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: product.id
      }
    }
  });

  const nextQuantity = Math.min(
    product.stock,
    (existingItem?.quantity || 0) + safeQuantity
  );

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: product.id
      }
    },
    update: {
      quantity: nextQuantity
    },
    create: {
      cartId: cart.id,
      productId: product.id,
      quantity: nextQuantity
    }
  });
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const cartId = await getCartCookieId();

  if (!cartId) {
    throw new Error("Cart not found");
  }

  const safeQuantity = Math.max(1, Math.floor(quantity));
  const item = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cartId
    },
    include: {
      product: true
    }
  });

  if (!item || !item.product.isPublished || item.product.stock < 1) {
    throw new Error("Cart item is unavailable");
  }

  await prisma.cartItem.update({
    where: {
      id: item.id
    },
    data: {
      quantity: Math.min(safeQuantity, item.product.stock)
    }
  });
}

export async function removeCartItem(cartItemId: string) {
  const cartId = await getCartCookieId();

  if (!cartId) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartId
    }
  });
}

type CheckoutInput = {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  note?: string;
  mockPaymentResult?: "success" | "failed";
};

export async function createOrderFromCart(input: CheckoutInput) {
  const cart = await getCurrentCart();

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  if (isEcpayProductionBlocked()) {
    throw new Error("ECPay production is not enabled");
  }

  const unavailableItem = cart.items.find((item) => {
    return !item.product.isPublished || item.quantity < 1 || item.product.stock < item.quantity;
  });

  if (unavailableItem) {
    throw new Error("Some cart items are unavailable");
  }

  const totals = calculateCartTotals(cart);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        merchantId: cart.merchantId,
        userId: input.userId || null,
        status: "pending",
        paymentStatus: "pending",
        paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail.toLowerCase(),
        note: input.note || null,
        shippingAddress: {
          address: input.address,
          phone: input.customerPhone
        },
        subtotal: new Prisma.Decimal(totals.subtotal),
        total: new Prisma.Decimal(totals.total),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity
          }))
        }
      }
    });

    for (const item of cart.items) {
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: {
            gte: item.quantity
          }
        },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      if (stockUpdate.count !== 1) {
        throw new Error("Insufficient stock");
      }

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          orderId: createdOrder.id,
          quantity: -item.quantity,
          reason: "order_created"
        }
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: createdOrder.id,
        previousStatus: null,
        nextStatus: "pending",
        note: "Order created"
      }
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id
      }
    });

    await tx.cart.delete({
      where: {
        id: cart.id
      }
    });

    return createdOrder;
  });

  await clearCartCookie();

  const paymentProvider = getPaymentProvider();
  const itemName = cart.items
    .map((item) => `${item.product.name} x ${item.quantity}`)
    .join("#")
    .slice(0, 400);
  const merchantTradeNo = createMerchantTradeNo();
  const paymentResult = await paymentProvider.createPayment({
    orderId: order.id,
    amount: Number(order.total),
    currency: "TWD",
    customerEmail: input.customerEmail.toLowerCase(),
    customerName: input.customerName,
    itemName,
    merchantTradeNo,
    mode: input.mockPaymentResult === "failed" ? "failed" : "success"
  });

  if (paymentResult.status === "pending" && paymentResult.actionUrl && paymentResult.formFields) {
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: input.userId || null,
        provider: paymentResult.provider,
        status: "pending",
        amount: order.total,
        currency: "TWD",
        merchantTradeNo,
        actionUrl: paymentResult.actionUrl,
        formData: paymentResult.formFields
      }
    });

    return {
      order,
      paymentRedirectUrl: `/checkout/payment/${payment.id}`
    };
  }

  const paidAt = paymentResult.status === "paid" ? paymentResult.paidAt || new Date() : null;
  const nextOrderStatus = paymentResult.status === "paid" ? "paid" : order.status;
  const nextPaymentStatus = paymentResult.status === "paid" ? "paid" : "failed";

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: order.id,
        userId: input.userId || null,
        provider: paymentResult.provider,
        status: nextPaymentStatus,
        amount: order.total,
        currency: "TWD",
        merchantTradeNo,
        transactionId: paymentResult.providerReference,
        failureReason: paymentResult.status === "failed" ? paymentResult.message || "Payment failed" : null,
        paidAt
      }
    });

    const updated = await tx.order.update({
      where: {
        id: order.id
      },
      data: {
        status: nextOrderStatus,
        paymentStatus: nextPaymentStatus,
        paymentProvider: paymentResult.provider,
        paymentTransactionId: paymentResult.providerReference,
        paidAt
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.status,
        nextStatus: nextOrderStatus,
        note:
          paymentResult.status === "paid"
            ? "Mock payment succeeded"
            : "Mock payment failed"
      }
    });

    return updated;
  });

  return {
    order: updatedOrder
  };
}

function createMerchantTradeNo() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  return `EC${timestamp}${random}`.slice(0, 20);
}

function isEcpayProductionBlocked() {
  return (
    process.env.PAYMENT_PROVIDER === "ecpay" &&
    process.env.PAYMENT_MODE === "production" &&
    process.env.ENABLE_ECPAY_PRODUCTION !== "true"
  );
}
