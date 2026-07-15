"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, denyAccess, requireAdminSession } from "@/lib/rbac";

const categorySchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1, "請輸入分類名稱"),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "網址代號只能使用英文、數字與連字號")
});

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCategoryForm(formData: FormData) {
  const parsed = categorySchema.safeParse({
    merchantId: formData.get("merchantId"),
    name: formData.get("name"),
    slug: normalizeSlug(formData.get("slug"))
  });

  if (!parsed.success) {
    redirectToCategories(parsed.error.issues[0]?.message || "請確認分類資料是否正確。");
  }

  return parsed.data;
}

function redirectToCategories(message: string): never {
  redirect(`/admin/categories?message=${encodeURIComponent(message)}`);
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = parseCategoryForm(formData);
  assertMerchantAccess(session, data.merchantId);

  try {
    await prisma.category.create({
      data
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectToCategories("同一個商家已經有相同網址代號的分類。");
    }

    throw error;
  }

  revalidateCategoryPaths();
  redirectToCategories("商品分類已新增。");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const session = await requireAdminSession();
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: {
      merchantId: true
    }
  });

  if (!category) {
    denyAccess();
  }

  assertMerchantAccess(session, category.merchantId);

  const data = parseCategoryForm(formData);
  assertMerchantAccess(session, data.merchantId);

  try {
    await prisma.category.update({
      where: {
        id: categoryId
      },
      data
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectToCategories("同一個商家已經有相同網址代號的分類。");
    }

    throw error;
  }

  revalidateCategoryPaths();
  redirectToCategories("商品分類已更新。");
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requireAdminSession();
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: {
      merchantId: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!category) {
    denyAccess();
  }

  assertMerchantAccess(session, category.merchantId);

  if (category._count.products > 0) {
    redirectToCategories("此分類仍有商品使用，請先調整商品分類後再刪除。");
  }

  await prisma.category.delete({
    where: {
      id: categoryId
    }
  });

  revalidateCategoryPaths();
  redirectToCategories("商品分類已刪除。");
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/products");
}
