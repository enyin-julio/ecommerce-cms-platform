"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession, requireRoles } from "@/lib/rbac";

const merchantSchema = z.object({
  name: z.string().min(1, "請輸入商家名稱"),
  slug: z.string().min(1, "請輸入網址代號").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "網址代號只能使用英文小寫、數字與減號"),
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

function revalidateMerchantPaths() {
  revalidatePath("/admin/merchants");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/pages");
  revalidatePath("/");
  revalidatePath("/products");
}
