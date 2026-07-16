"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";
import { getThemePresetById, themePresets } from "@/lib/theme-presets";

const themeSettingSchema = z.object({
  merchantId: z.string().min(1),
  themePreset: z.string().min(1)
});

export async function applyThemeAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = themeSettingSchema.parse({
    merchantId: formData.get("merchantId"),
    themePreset: formData.get("themePreset")
  });

  assertMerchantAccess(session, data.merchantId);

  const theme = getThemePresetById(data.themePreset);
  const isKnownTheme = themePresets.some((preset) => preset.id === data.themePreset);

  if (!isKnownTheme) {
    throw new Error("找不到要套用的主題");
  }

  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: {
      id: data.merchantId
    },
    select: {
      name: true
    }
  });

  await prisma.siteSetting.upsert({
    where: {
      merchantId: data.merchantId
    },
    create: {
      merchantId: data.merchantId,
      siteName: merchant.name,
      themeLayout: theme.layout,
      themePreset: theme.id,
      primaryColor: theme.primaryColor
    },
    update: {
      themeLayout: theme.layout,
      themePreset: theme.id,
      primaryColor: theme.primaryColor
    }
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/admin/themes");
  redirect(`/admin/themes?merchantId=${data.merchantId}&saved=1`);
}
