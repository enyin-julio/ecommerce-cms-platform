"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, denyAccess, requireAdminSession } from "@/lib/rbac";

const productSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().min(1).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative(),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().optional(),
  isPublished: z.boolean(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
});

function parseProductForm(formData: FormData) {
  return productSchema.parse({
    merchantId: formData.get("merchantId"),
    name: formData.get("name"),
    sku: formData.get("sku"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId") || undefined,
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice") || undefined,
    stock: formData.get("stock"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl") || "",
    isPublished: formData.get("isPublished") === "on",
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined
  });
}

async function assertCategoryBelongsToMerchant(categoryId: string | undefined, merchantId: string) {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: {
      merchantId: true
    }
  });

  if (!category || category.merchantId !== merchantId) {
    denyAccess();
  }
}

export async function createProductAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = parseProductForm(formData);

  assertMerchantAccess(session, data.merchantId);
  await assertCategoryBelongsToMerchant(data.categoryId, data.merchantId);

  await prisma.product.create({
    data: {
      merchantId: data.merchantId,
      name: data.name,
      sku: data.sku,
      slug: data.slug,
      categoryId: data.categoryId || null,
      price: new Prisma.Decimal(data.price),
      originalPrice:
        data.originalPrice === undefined ? null : new Prisma.Decimal(data.originalPrice),
      stock: data.stock,
      shortDescription: data.shortDescription,
      description: data.description,
      imageUrl: data.imageUrl || null,
      isPublished: data.isPublished,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      merchantId: true
    }
  });

  if (!existingProduct) {
    denyAccess();
  }

  assertMerchantAccess(session, existingProduct.merchantId);

  const data = parseProductForm(formData);
  assertMerchantAccess(session, data.merchantId);
  await assertCategoryBelongsToMerchant(data.categoryId, data.merchantId);

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      merchantId: data.merchantId,
      name: data.name,
      sku: data.sku,
      slug: data.slug,
      categoryId: data.categoryId || null,
      price: new Prisma.Decimal(data.price),
      originalPrice:
        data.originalPrice === undefined ? null : new Prisma.Decimal(data.originalPrice),
      stock: data.stock,
      shortDescription: data.shortDescription,
      description: data.description,
      imageUrl: data.imageUrl || null,
      isPublished: data.isPublished,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function toggleProductPublishedAction(productId: string) {
  const session = await requireAdminSession();
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      merchantId: true,
      isPublished: true
    }
  });

  if (!product) {
    denyAccess();
  }

  assertMerchantAccess(session, product.merchantId);

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      isPublished: !product.isPublished
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}
