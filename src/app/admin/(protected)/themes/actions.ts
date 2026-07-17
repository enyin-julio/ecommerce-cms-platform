"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";
import { getThemePresetById, themePresets } from "@/lib/theme-presets";

const applyThemeSchema = z.object({
  merchantId: z.string().min(1),
  themePreset: z.string().min(1)
});

const styleSettingSchema = z.object({
  merchantId: z.string().min(1),
  themeHeaderStyle: z.enum(["header-1", "header-2", "header-3", "header-4"]),
  themeFooterStyle: z.enum(["footer-1", "footer-2", "footer-3", "footer-4"]),
  themeFontFamily: z.enum(["noto-sans-tc", "system", "serif", "rounded"]),
  themeHeadingScale: z.enum(["compact", "default", "large"]),
  themeNavigationStyle: z.enum(["standard", "centered", "compact"]),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "請輸入正確的 HEX 色碼，例如 #2563eb")
});

export async function applyThemeAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = applyThemeSchema.parse({
    merchantId: formData.get("merchantId"),
    themePreset: formData.get("themePreset")
  });

  assertMerchantAccess(session, data.merchantId);

  const theme = getThemePresetById(data.themePreset);
  const isKnownTheme = themePresets.some((preset) => preset.id === data.themePreset);

  if (!isKnownTheme) {
    throw new Error("找不到要套用的主題。");
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

  revalidateThemePaths();
  redirect(`/admin/themes?merchantId=${data.merchantId}&tab=choose&saved=theme`);
}

export async function updateThemeStyleAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = styleSettingSchema.parse({
    merchantId: formData.get("merchantId"),
    themeHeaderStyle: formData.get("themeHeaderStyle") || "header-1",
    themeFooterStyle: formData.get("themeFooterStyle") || "footer-1",
    themeFontFamily: formData.get("themeFontFamily") || "noto-sans-tc",
    themeHeadingScale: formData.get("themeHeadingScale") || "default",
    themeNavigationStyle: formData.get("themeNavigationStyle") || "standard",
    primaryColor: formData.get("primaryColor") || "#2563eb"
  });

  assertMerchantAccess(session, data.merchantId);

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
      primaryColor: data.primaryColor,
      themeHeaderStyle: data.themeHeaderStyle,
      themeFooterStyle: data.themeFooterStyle,
      themeFontFamily: data.themeFontFamily,
      themeHeadingScale: data.themeHeadingScale,
      themeNavigationStyle: data.themeNavigationStyle
    },
    update: {
      primaryColor: data.primaryColor,
      themeHeaderStyle: data.themeHeaderStyle,
      themeFooterStyle: data.themeFooterStyle,
      themeFontFamily: data.themeFontFamily,
      themeHeadingScale: data.themeHeadingScale,
      themeNavigationStyle: data.themeNavigationStyle
    }
  });

  revalidateThemePaths();
  redirect(`/admin/themes?merchantId=${data.merchantId}&tab=edit&saved=style`);
}

function revalidateThemePaths() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/admin/themes");
}
