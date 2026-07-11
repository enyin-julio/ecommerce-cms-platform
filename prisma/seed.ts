// @ts-nocheck
const { PrismaClient, Prisma } = require("@prisma/client");
const { pbkdf2Sync, randomBytes } = require("crypto");

const prisma = new PrismaClient();

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error(
    "Refusing to seed demo data in production. Set ALLOW_PRODUCTION_SEED=true only for disposable environments."
  );
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

async function main() {
  const merchant = await prisma.merchant.upsert({
    where: {
      slug: "demo-merchant"
    },
    update: {
      name: "Demo Merchant",
      contactEmail: "merchant@example.com"
    },
    create: {
      name: "Demo Merchant",
      slug: "demo-merchant",
      contactEmail: "merchant@example.com"
    }
  });

  await prisma.user.upsert({
    where: {
      email: "admin@example.com"
    },
    update: {
      name: "Platform Admin",
      role: "admin",
      merchantId: null
    },
    create: {
      name: "Platform Admin",
      email: "admin@example.com",
      passwordHash: hashPassword("Admin123!"),
      role: "admin"
    }
  });

  await prisma.user.upsert({
    where: {
      email: "merchant@example.com"
    },
    update: {
      name: "Demo Merchant Admin",
      role: "merchant",
      merchantId: merchant.id
    },
    create: {
      name: "Demo Merchant Admin",
      email: "merchant@example.com",
      passwordHash: hashPassword("Merchant123!"),
      role: "merchant",
      merchantId: merchant.id
    }
  });

  const customer = await prisma.user.upsert({
    where: {
      email: "customer@example.com"
    },
    update: {
      name: "Demo Customer",
      phone: "0912345678",
      address: "1 Demo Road, Taipei",
      role: "customer",
      merchantId: null
    },
    create: {
      name: "Demo Customer",
      email: "customer@example.com",
      passwordHash: hashPassword("Customer123!"),
      phone: "0912345678",
      address: "1 Demo Road, Taipei",
      role: "customer"
    }
  });

  const categories = await Promise.all(
    [
      { name: "Lifestyle", slug: "lifestyle" },
      { name: "Care", slug: "care" },
      { name: "Gift Box", slug: "gift-box" }
    ].map((category) =>
      prisma.category.upsert({
        where: {
          merchantId_slug: {
            merchantId: merchant.id,
            slug: category.slug
          }
        },
        update: {
          name: category.name
        },
        create: {
          merchantId: merchant.id,
          name: category.name,
          slug: category.slug
        }
      })
    )
  );

  const [lifestyleCategory, careCategory, giftBoxCategory] = categories;

  const products = [
    {
      categoryId: lifestyleCategory.id,
      name: "Daily Canvas Tote",
      sku: "DEMO-TOTE-001",
      slug: "daily-canvas-tote",
      shortDescription: "A durable tote for daily shopping, commuting, and branded campaigns.",
      description:
        "Made with heavy cotton canvas and a clean brand identity. Useful as a brand product, event gift, or ecommerce item.",
      price: "680",
      originalPrice: "880",
      stock: 24,
      imageUrl:
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Daily Canvas Tote",
      seoDescription: "A durable daily canvas tote for brand and lifestyle use."
    },
    {
      categoryId: careCategory.id,
      name: "Botanical Hand Wash",
      sku: "DEMO-HANDWASH-001",
      slug: "botanical-hand-wash",
      shortDescription: "A gentle hand wash with a fresh botanical scent.",
      description:
        "A mild cleansing formula suitable for brand websites, product pages, and subscription refill programs.",
      price: "420",
      originalPrice: "520",
      stock: 36,
      imageUrl:
        "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Botanical Hand Wash",
      seoDescription: "Gentle botanical hand wash for home and brand spaces."
    },
    {
      categoryId: giftBoxCategory.id,
      name: "Seasonal Brand Gift Box",
      sku: "DEMO-GIFTBOX-001",
      slug: "seasonal-brand-gift-box",
      shortDescription: "A seasonal gift box with products, message cards, and branded packaging.",
      description:
        "Designed for seasonal campaigns, corporate gifts, and member programs. Works well with landing pages and ecommerce product pages.",
      price: "1680",
      originalPrice: "1980",
      stock: 12,
      imageUrl:
        "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Seasonal Brand Gift Box",
      seoDescription: "A polished seasonal gift box for campaigns and corporate gifting."
    }
  ];

  const seededProducts = [];

  for (const product of products) {
    const seededProduct = await prisma.product.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: product.slug
        }
      },
      update: {
        ...product,
        price: new Prisma.Decimal(product.price),
        originalPrice: new Prisma.Decimal(product.originalPrice),
        isPublished: true,
        merchantId: merchant.id
      },
      create: {
        ...product,
        merchantId: merchant.id,
        price: new Prisma.Decimal(product.price),
        originalPrice: new Prisma.Decimal(product.originalPrice),
        isPublished: true
      }
    });
    seededProducts.push(seededProduct);
  }

  const demoOrderId = "demo-order-pending";

  await prisma.stockMovement.deleteMany({
    where: {
      orderId: demoOrderId
    }
  });
  await prisma.order.deleteMany({
    where: {
      id: demoOrderId
    }
  });

  const orderItems = [
    {
      product: seededProducts[0],
      quantity: 2
    },
    {
      product: seededProducts[1],
      quantity: 1
    }
  ];
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  const demoOrder = await prisma.order.create({
    data: {
      id: demoOrderId,
      merchantId: merchant.id,
      userId: customer.id,
      status: "pending",
      paymentStatus: "unpaid",
      paymentProvider: "mock",
      customerName: "Demo Customer",
      customerPhone: "0912345678",
      customerEmail: "customer@example.com",
      note: "Seed order for MVP verification.",
      shippingAddress: {
        address: "1 Demo Road, Taipei",
        phone: "0912345678"
      },
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(subtotal),
      items: {
        create: orderItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity
        }))
      },
      statusHistories: {
        create: {
          previousStatus: null,
          nextStatus: "pending",
          changedById: null,
          note: "Seed order created"
        }
      }
    }
  });

  for (const item of orderItems) {
    await prisma.product.updateMany({
      where: {
        id: item.product.id,
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

    await prisma.stockMovement.create({
      data: {
        productId: item.product.id,
        orderId: demoOrder.id,
        quantity: -item.quantity,
        reason: "seed_order_created"
      }
    });
  }

  const pages = [
    {
      title: "Brand Story",
      slug: "brand-story",
      type: "brand",
      heroTitle: "A commerce CMS built for modern brands",
      heroSubtitle:
        "Tell the brand story, publish editorial content, and connect visitors to products from one admin system.",
      heroImageUrl:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
      contentBlocks: [
        {
          type: "text",
          title: "Brand positioning",
          body: "This demo page shows how a merchant can manage brand storytelling content with a simple JSON block editor."
        },
        {
          type: "text",
          title: "Composable content",
          body: "The first CMS version keeps blocks as JSON. A visual editor can be added later without changing the storage model."
        }
      ],
      seoTitle: "Brand Story",
      seoDescription: "A demo brand page managed by the ecommerce CMS.",
      isPublished: true
    },
    {
      title: "Summer Launch Campaign",
      slug: "summer-launch",
      type: "landing",
      heroTitle: "Launch a focused campaign page",
      heroSubtitle:
        "Use landing pages for seasonal collections, limited offers, and brand advertising campaigns.",
      heroImageUrl:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1400&q=80",
      contentBlocks: [
        {
          type: "text",
          title: "Campaign message",
          body: "A landing page can highlight a single offer and guide visitors toward featured products."
        },
        {
          type: "text",
          title: "SEO friendly",
          body: "Each published landing page has server-rendered metadata and clean public URLs."
        }
      ],
      seoTitle: "Summer Launch Campaign",
      seoDescription: "A sample landing page for a seasonal brand campaign.",
      isPublished: true
    },
    {
      title: "Materials Guide",
      slug: "materials-guide",
      type: "content",
      heroTitle: "Materials Guide",
      heroSubtitle: "Explain product materials, care tips, and brand values with regular content pages.",
      heroImageUrl:
        "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=1400&q=80",
      contentBlocks: [
        {
          type: "text",
          title: "Care instructions",
          body: "Use content pages for policies, buying guides, material explanations, and educational content."
        },
        {
          type: "text",
          title: "Operational content",
          body: "These pages are separate from landing pages so merchants can manage both campaign and evergreen content."
        }
      ],
      seoTitle: "Materials Guide",
      seoDescription: "A sample content page managed by the CMS.",
      isPublished: true
    }
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: page.slug
        }
      },
      update: {
        ...page,
        merchantId: merchant.id
      },
      create: {
        ...page,
        merchantId: merchant.id
      }
    });
  }

  await prisma.siteSetting.upsert({
    where: {
      merchantId: merchant.id
    },
    update: {
      siteName: "Commerce Studio Demo",
      seoTitle: "Commerce Studio Demo",
      seoDescription:
        "A demo CMS platform for brand websites, product catalogs, and ecommerce storefronts."
    },
    create: {
      merchantId: merchant.id,
      siteName: "Commerce Studio Demo",
      seoTitle: "Commerce Studio Demo",
      seoDescription:
        "A demo CMS platform for brand websites, product catalogs, and ecommerce storefronts."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
