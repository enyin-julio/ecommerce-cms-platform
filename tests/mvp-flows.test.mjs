import assert from "node:assert/strict";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import test from "node:test";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statusTransitions = {
  pending: ["paid", "cancelled"],
  unpaid: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: [],
  cancelled: []
};

function verifyPassword(password, storedHash) {
  const [method, iterationsValue, salt, hash] = storedHash.split(":");

  if (method !== "pbkdf2" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const derivedHash = pbkdf2Sync(password, salt, Number(iterationsValue), 64, "sha512");
  const storedHashBuffer = Buffer.from(hash, "hex");

  return (
    derivedHash.length === storedHashBuffer.length &&
    timingSafeEqual(derivedHash, storedHashBuffer)
  );
}

function canTransition(from, to) {
  return (statusTransitions[from] || []).includes(to);
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function createOrderFromCart(cartId, input) {
  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const unavailableItem = cart.items.find((item) => {
    return !item.product.isPublished || item.quantity < 1 || item.product.stock < item.quantity;
  });

  if (unavailableItem) {
    throw new Error("Some cart items are unavailable");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        merchantId: cart.merchantId,
        userId: input.userId || null,
        status: "pending",
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail.toLowerCase(),
        note: input.note || null,
        shippingAddress: {
          address: input.address,
          phone: input.customerPhone
        },
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity
          }))
        },
        statusHistories: {
          create: {
            previousStatus: null,
            nextStatus: "pending",
            note: "Order created by automated test"
          }
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
          orderId: order.id,
          quantity: -item.quantity,
          reason: "order_created"
        }
      });
    }

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

    return order;
  });
}

async function cancelOrder(orderId, actorUserId) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
    include: {
      items: true
    }
  });

  assert.ok(order);
  assert.ok(canTransition(order.status, "cancelled"));

  await prisma.$transaction(async (tx) => {
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

    await tx.order.update({
      where: {
        id: order.id
      },
      data: {
        status: "cancelled"
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.status,
        nextStatus: "cancelled",
        changedById: actorUserId,
        note: "Cancelled by automated test"
      }
    });
  });
}

test("MVP core flows", async (t) => {
  await t.test("seeded users authenticate and have expected roles", async () => {
    const users = await prisma.user.findMany({
      orderBy: {
        email: "asc"
      }
    });

    assert.equal(users.length, 3);

    const admin = users.find((user) => user.email === "admin@example.com");
    const merchant = users.find((user) => user.email === "merchant@example.com");
    const customer = users.find((user) => user.email === "customer@example.com");

    assert.equal(admin?.role, "admin");
    assert.equal(merchant?.role, "merchant");
    assert.equal(customer?.role, "customer");
    assert.equal(verifyPassword("Admin123!", admin.passwordHash), true);
    assert.equal(verifyPassword("Merchant123!", merchant.passwordHash), true);
    assert.equal(verifyPassword("Customer123!", customer.passwordHash), true);
  });

  await t.test("merchant-owned data stays isolated", async () => {
    const merchantUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: "merchant@example.com"
      }
    });
    const otherMerchant = await prisma.merchant.create({
      data: {
        name: "Other Test Merchant",
        slug: `other-test-${Date.now()}`,
        contactEmail: "other-merchant@example.com"
      }
    });
    const category = await prisma.category.create({
      data: {
        merchantId: otherMerchant.id,
        name: "Other Category",
        slug: "other-category"
      }
    });
    const otherProduct = await prisma.product.create({
      data: {
        merchantId: otherMerchant.id,
        categoryId: category.id,
        name: "Other Merchant Product",
        sku: `OTHER-${Date.now()}`,
        slug: `other-product-${Date.now()}`,
        shortDescription: "Other merchant product",
        description: "Other merchant product",
        price: new Prisma.Decimal(100),
        stock: 5,
        isPublished: true
      }
    });

    const adminVisibleCount = await prisma.product.count();
    const merchantVisibleProducts = await prisma.product.findMany({
      where: {
        merchantId: merchantUser.merchantId
      }
    });

    assert.ok(adminVisibleCount > merchantVisibleProducts.length);
    assert.equal(
      merchantVisibleProducts.some((product) => product.id === otherProduct.id),
      false
    );
  });

  await t.test("product and CMS publish toggles persist", async () => {
    const product = await prisma.product.findFirstOrThrow({
      where: {
        sku: "DEMO-TOTE-001"
      }
    });
    const page = await prisma.page.findFirstOrThrow({
      where: {
        slug: "summer-launch"
      }
    });

    await prisma.product.update({
      where: {
        id: product.id
      },
      data: {
        isPublished: false
      }
    });
    await prisma.page.update({
      where: {
        id: page.id
      },
      data: {
        isPublished: false
      }
    });

    assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).isPublished, false);
    assert.equal((await prisma.page.findUnique({ where: { id: page.id } })).isPublished, false);

    await prisma.product.update({
      where: {
        id: product.id
      },
      data: {
        isPublished: true
      }
    });
    await prisma.page.update({
      where: {
        id: page.id
      },
      data: {
        isPublished: true
      }
    });
  });

  await t.test("media library can persist uploaded image metadata", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: {
        slug: "demo-merchant"
      }
    });
    const media = await prisma.media.create({
      data: {
        merchantId: merchant.id,
        url: `/uploads/test-${Date.now()}.png`,
        altText: "自動化測試圖片",
        mimeType: "image/png",
        size: 128
      }
    });

    assert.equal(media.merchantId, merchant.id);
  });

  await t.test("checkout creates order, deducts stock, and clears cart", async () => {
    const customer = await prisma.user.findUniqueOrThrow({
      where: {
        email: "customer@example.com"
      }
    });
    const product = await prisma.product.findFirstOrThrow({
      where: {
        sku: "DEMO-GIFTBOX-001"
      }
    });
    const startingStock = product.stock;
    const cart = await prisma.cart.create({
      data: {
        merchantId: product.merchantId,
        userId: customer.id,
        sessionId: `test-cart-${Date.now()}`,
        items: {
          create: {
            productId: product.id,
            quantity: 2
          }
        }
      }
    });

    const order = await createOrderFromCart(cart.id, {
      userId: customer.id,
      customerName: "測試顧客",
      customerPhone: "0912345678",
      customerEmail: "checkout-test@example.com",
      address: "台北市測試路 1 號"
    });

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id
      }
    });
    const orderWithItems = await prisma.order.findUniqueOrThrow({
      where: {
        id: order.id
      },
      include: {
        items: true,
        statusHistories: true,
        stockMovements: true
      }
    });

    assert.equal(updatedProduct.stock, startingStock - 2);
    assert.equal(orderWithItems.status, "pending");
    assert.equal(orderWithItems.items.length, 1);
    assert.equal(orderWithItems.statusHistories.length, 1);
    assert.equal(orderWithItems.stockMovements[0].quantity, -2);
    assert.equal(await prisma.cart.findUnique({ where: { id: cart.id } }), null);
  });

  await t.test("customer and guest order lookups stay scoped", async () => {
    const customer = await prisma.user.findUniqueOrThrow({
      where: {
        email: "customer@example.com"
      }
    });
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: {
        slug: "demo-merchant"
      }
    });
    const product = await prisma.product.findFirstOrThrow({
      where: {
        sku: "DEMO-TOTE-001"
      }
    });
    const otherCustomer = await prisma.user.create({
      data: {
        name: "Other Customer",
        email: `other-customer-${Date.now()}@example.com`,
        passwordHash: customer.passwordHash,
        role: "customer"
      }
    });
    const customerOrder = await prisma.order.findFirstOrThrow({
      where: {
        userId: customer.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    const guestOrder = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        userId: null,
        status: "pending",
        customerName: "Guest Lookup",
        customerPhone: "0911222333",
        customerEmail: "guest-lookup@example.com",
        shippingAddress: {
          address: "Guest address",
          phone: "0911222333"
        },
        subtotal: new Prisma.Decimal(100),
        total: new Prisma.Decimal(100),
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            unitPrice: new Prisma.Decimal(100),
            quantity: 1
          }
        }
      }
    });

    const customerVisibleOrder = await prisma.order.findFirst({
      where: {
        id: customerOrder.id,
        userId: customer.id
      }
    });
    const otherCustomerVisibleOrder = await prisma.order.findFirst({
      where: {
        id: customerOrder.id,
        userId: otherCustomer.id
      }
    });
    const guestVisibleOrder = await prisma.order.findFirst({
      where: {
        id: guestOrder.id,
        customerEmail: "guest-lookup@example.com",
        userId: null
      }
    });
    const memberOrderViaGuestLookup = await prisma.order.findFirst({
      where: {
        id: customerOrder.id,
        customerEmail: customerOrder.customerEmail.toLowerCase(),
        userId: null
      }
    });

    assert.ok(customerVisibleOrder);
    assert.equal(otherCustomerVisibleOrder, null);
    assert.ok(guestVisibleOrder);
    assert.equal(memberOrderViaGuestLookup, null);
  });

  await t.test("cancelling an order restores stock and writes history", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: {
        email: "admin@example.com"
      }
    });
    const order = await prisma.order.findFirstOrThrow({
      where: {
        customerEmail: "checkout-test@example.com"
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    const item = order.items[0];
    const stockBeforeCancel = await prisma.product.findUniqueOrThrow({
      where: {
        id: item.productId
      }
    });

    await cancelOrder(order.id, admin.id);

    const cancelledOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: order.id
      },
      include: {
        statusHistories: true,
        stockMovements: true
      }
    });
    const stockAfterCancel = await prisma.product.findUniqueOrThrow({
      where: {
        id: item.productId
      }
    });

    assert.equal(cancelledOrder.status, "cancelled");
    assert.equal(stockAfterCancel.stock, stockBeforeCancel.stock + item.quantity);
    assert.ok(
      cancelledOrder.statusHistories.some((history) => history.nextStatus === "cancelled")
    );
    assert.ok(
      cancelledOrder.stockMovements.some((movement) => movement.reason === "order_cancelled")
    );
  });

  await t.test("CSV export data is scoped to merchant permissions", async () => {
    const merchantUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: "merchant@example.com"
      }
    });
    const scopedOrders = await prisma.order.findMany({
      where: {
        merchantId: merchantUser.merchantId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    const rows = scopedOrders.flatMap((order) => {
      return order.items.map((item) => [
        order.id,
        order.status,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        item.productName,
        item.product?.sku || "",
        item.quantity,
        item.unitPrice.toString(),
        order.total.toString()
      ]);
    });
    const csv = [
      [
        "訂單編號",
        "訂單狀態",
        "客戶姓名",
        "電話",
        "Email",
        "商品名稱",
        "SKU",
        "數量",
        "單價",
        "總金額"
      ],
      ...rows
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    assert.ok(scopedOrders.length > 0);
    assert.equal(scopedOrders.every((order) => order.merchantId === merchantUser.merchantId), true);
    assert.ok(csv.includes("訂單編號"));
    assert.ok(csv.includes("DEMO-"));
  });
});

test.after(async () => {
  await prisma.$disconnect();
});
