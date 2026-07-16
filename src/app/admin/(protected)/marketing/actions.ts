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

const marketingSettingSchema = z.object({
  merchantId: z.string().min(1),
  googleSearchConsoleVerification: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  googleAnalyticsMeasurementId: z.string().optional(),
  metaPixelId: z.string().optional(),
  facebookBusinessExtensionNote: z.string().optional()
});

export async function updateMarketingSettingAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = marketingSettingSchema.parse({
    merchantId: formData.get("merchantId"),
    googleSearchConsoleVerification:
      formData.get("googleSearchConsoleVerification") || undefined,
    googleTagManagerId: formData.get("googleTagManagerId") || undefined,
    googleAnalyticsMeasurementId: formData.get("googleAnalyticsMeasurementId") || undefined,
    metaPixelId: formData.get("metaPixelId") || undefined,
    facebookBusinessExtensionNote: formData.get("facebookBusinessExtensionNote") || undefined
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
      googleSearchConsoleVerification: normalizeGoogleSearchVerification(
        data.googleSearchConsoleVerification
      ),
      googleTagManagerId: normalizeGoogleTagManagerId(data.googleTagManagerId),
      googleAnalyticsMeasurementId: normalizeGoogleAnalyticsMeasurementId(
        data.googleAnalyticsMeasurementId
      ),
      metaPixelId: normalizeMetaPixelId(data.metaPixelId),
      facebookBusinessExtensionNote: normalizeMarketingNote(
        data.facebookBusinessExtensionNote
      )
    },
    update: {
      googleSearchConsoleVerification: normalizeGoogleSearchVerification(
        data.googleSearchConsoleVerification
      ),
      googleTagManagerId: normalizeGoogleTagManagerId(data.googleTagManagerId),
      googleAnalyticsMeasurementId: normalizeGoogleAnalyticsMeasurementId(
        data.googleAnalyticsMeasurementId
      ),
      metaPixelId: normalizeMetaPixelId(data.metaPixelId),
      facebookBusinessExtensionNote: normalizeMarketingNote(
        data.facebookBusinessExtensionNote
      )
    }
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing?merchantId=${data.merchantId}&saved=1`);
}
