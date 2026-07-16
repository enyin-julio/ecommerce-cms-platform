"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  normalizeGoogleAnalyticsMeasurementId,
  normalizeGoogleSearchVerification,
  normalizeGoogleTagManagerId,
  normalizeMarketingNote,
  normalizeMetaPixelId
} from "@/lib/google-search-verification";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";

const siteSettingSchema = z.object({
  merchantId: z.string().min(1),
  siteName: z.string().min(1, "請輸入網站名稱"),
  logoUrl: z.string().optional(),
  logoUrlManual: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "主色需使用 HEX 格式，例如 #2563eb"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  googleSearchConsoleVerification: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  googleAnalyticsMeasurementId: z.string().optional(),
  metaPixelId: z.string().optional(),
  facebookBusinessExtensionNote: z.string().optional()
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
    seoDescription: formData.get("seoDescription") || undefined,
    googleSearchConsoleVerification:
      formData.get("googleSearchConsoleVerification") || undefined,
    googleTagManagerId: formData.get("googleTagManagerId") || undefined,
    googleAnalyticsMeasurementId: formData.get("googleAnalyticsMeasurementId") || undefined,
    metaPixelId: formData.get("metaPixelId") || undefined,
    facebookBusinessExtensionNote: formData.get("facebookBusinessExtensionNote") || undefined
  });
  const logoUrl = data.logoUrlManual?.trim() || data.logoUrl?.trim() || null;
  const googleSearchConsoleVerification = normalizeGoogleSearchVerification(
    data.googleSearchConsoleVerification
  );
  const googleTagManagerId = normalizeGoogleTagManagerId(data.googleTagManagerId);
  const googleAnalyticsMeasurementId = normalizeGoogleAnalyticsMeasurementId(
    data.googleAnalyticsMeasurementId
  );
  const metaPixelId = normalizeMetaPixelId(data.metaPixelId);
  const facebookBusinessExtensionNote = normalizeMarketingNote(
    data.facebookBusinessExtensionNote
  );

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
      seoDescription: data.seoDescription || null,
      googleSearchConsoleVerification,
      googleTagManagerId,
      googleAnalyticsMeasurementId,
      metaPixelId,
      facebookBusinessExtensionNote
    },
    update: {
      siteName: data.siteName,
      logoUrl,
      primaryColor: data.primaryColor,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      googleSearchConsoleVerification,
      googleTagManagerId,
      googleAnalyticsMeasurementId,
      metaPixelId,
      facebookBusinessExtensionNote
    }
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?merchantId=${data.merchantId}&saved=1`);
}
