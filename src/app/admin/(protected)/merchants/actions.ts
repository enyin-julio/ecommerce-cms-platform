"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession, requireRoles } from "@/lib/rbac";

const merchantSchema = z.object({
  name: z.string().min(1, "請輸入商家名稱"),
  slug: z
    .string()
    .min(1, "請輸入網址代號")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "網址代號只能使用英文小寫、數字與減號"),
  contactEmail: z.string().email("請輸入正確 Email")
});

function parseMerchantForm(formData: FormData) {
  return merchantSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    contactEmail: formData.get("contactEmail")
  });
}

function redirectToMerchants(message: string) {
  redirect(`/admin/merchants?message=${encodeURIComponent(message)}`);
}

export async function createMerchantAction(formData: FormData) {
  await requireRoles(["admin"]);
  const data = parseMerchantForm(formData);

  try {
    await prisma.merchant.create({
      data
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectToMerchants("網址代號已被使用，請換一個。");
    }

    throw error;
  }

  revalidateMerchantPaths();
  redirectToMerchants("商家已新增。");
}

export async function updateMerchantAction(merchantId: string, formData: FormData) {
  const session = await requireAdminSession();
  assertMerchantAccess(session, merchantId);

  const data = parseMerchantForm(formData);

  try {
    await prisma.merchant.update({
      where: {
        id: merchantId
      },
      data
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectToMerchants("網址代號已被使用，請換一個。");
    }

    throw error;
  }

  revalidateMerchantPaths();
  redirectToMerchants("商家資料已更新。");
}

export async function deleteMerchantAction(merchantId: string) {
  await requireRoles(["admin"]);

  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    },
    select: {
      _count: {
        select: {
          users: true,
          products: true,
          categories: true,
          pages: true,
          media: true,
          orders: true,
          carts: true
        }
      },
      siteSetting: {
        select: {
          id: true
        }
      }
    }
  });

  if (!merchant) {
    return redirectToMerchants("找不到商家資料。");
  }

  const relatedCount =
    merchant._count.users +
    merchant._count.products +
    merchant._count.categories +
    merchant._count.pages +
    merchant._count.media +
    merchant._count.orders +
    merchant._count.carts +
    (merchant.siteSetting ? 1 : 0);

  if (relatedCount > 0) {
    redirectToMerchants("此商家仍有商品、分類、頁面、訂單、媒體、使用者或網站設定，無法直接刪除。");
  }

  await prisma.merchant.delete({
    where: {
      id: merchantId
    }
  });

  revalidateMerchantPaths();
  redirectToMerchants("商家已刪除。");
}

export async function toggleMerchantActiveAction(merchantId: string) {
  await requireRoles(["admin"]);

  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    },
    select: {
      isActive: true
    }
  });

  if (!merchant) {
    return redirectToMerchants("找不到商家資料。");
  }

  const nextIsActive = !merchant.isActive;

  await prisma.merchant.update({
    where: {
      id: merchantId
    },
    data: {
      isActive: nextIsActive
    }
  });

  revalidateMerchantPaths();
  redirectToMerchants(nextIsActive ? "商家已啟用。" : "商家已停用，前台將不再顯示此商家的公開資料。");
}

function revalidateMerchantPaths() {
  revalidatePath("/admin/merchants");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/pages");
  revalidatePath("/");
  revalidatePath("/products");
}
