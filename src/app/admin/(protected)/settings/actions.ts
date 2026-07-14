"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";

const siteSettingSchema = z.object({
  merchantId: z.string().min(1),
  siteName: z.string().min(1, "請輸入網站名稱"),
  logoUrl: z.string().optional(),
  logoUrlManual: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "主色需使用 HEX 色碼，例如 #2563eb"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
});

export async function updateSiteSettingAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = siteSettingSchema.parse({
    merchantId: formData.get("merchantId"),
    siteName: formData.get("siteName"),
    logoUrl: formData.get("logoUrl") || undefined,
    logoUrlManual: formData.get("logoUrlManual") || undefined,
    primaryColor: formData.get("primaryColor") || "#2563eb",
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined
  });
  const logoUrl = data.logoUrlManual?.trim() || data.logoUrl?.trim() || null;

  assertMerchantAccess(session, data.merchantId);

  await prisma.siteSetting.upsert({
    where: {
      merchantId: data.merchantId
    },
    create: {
      merchantId: data.merchantId,
      siteName: data.siteName,
      logoUrl,
      primaryColor: data.primaryColor,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null
    },
    update: {
      siteName: data.siteName,
      logoUrl,
      primaryColor: data.primaryColor,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null
    }
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?merchantId=${data.merchantId}&saved=1`);
}
