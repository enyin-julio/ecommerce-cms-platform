import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/lib/session-token";

const publicProductSelect = {
  id: true,
  name: true,
  sku: true,
  slug: true,
  shortDescription: true,
  description: true,
  price: true,
  originalPrice: true,
  stock: true,
  imageUrl: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      name: true,
      slug: true
    }
  }
};

export async function getPublishedProducts() {
  return prisma.product.findMany({
    where: {
      isPublished: true,
      merchant: {
        isActive: true
      }
    },
    select: publicProductSelect,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getPublishedProductCategories() {
  return prisma.category.findMany({
    where: {
      products: {
        some: {
          isPublished: true,
          merchant: {
            isActive: true
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: {
            where: {
              isPublished: true,
              merchant: {
                isActive: true
              }
            }
          }
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isPublished: true,
      merchant: {
        isActive: true
      }
    },
    select: publicProductSelect
  });
}

export async function getAdminProducts(session: AdminSession) {
  return prisma.product.findMany({
    where:
      session.role === "merchant" && session.merchantId
        ? {
            merchantId: session.merchantId
          }
        : undefined,
    include: {
      category: true,
      merchant: true
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 50
  });
}

export async function getAdminProductById(id: string, session: AdminSession) {
  return prisma.product.findFirst({
    where: {
      id,
      ...(session.role === "merchant" && session.merchantId
        ? { merchantId: session.merchantId }
        : {})
    },
    include: {
      category: true,
      merchant: true
    }
  });
}

export async function getAdminMerchants(session: AdminSession) {
  return prisma.merchant.findMany({
    where:
      session.role === "merchant" && session.merchantId
        ? {
            id: session.merchantId
          }
        : undefined,
    orderBy: {
      name: "asc"
    }
  });
}

export async function getAdminCategories(session: AdminSession) {
  return prisma.category.findMany({
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
      name: "asc"
    }
  });
}

export async function getAdminCategoriesWithProductCount(session: AdminSession) {
  return prisma.category.findMany({
    where:
      session.role === "merchant" && session.merchantId
        ? {
            merchantId: session.merchantId
          }
        : undefined,
    include: {
      merchant: true,
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
