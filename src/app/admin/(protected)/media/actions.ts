"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";
import { getStorageProvider } from "@/modules/storage/storage-provider.factory";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadSize = 5 * 1024 * 1024;

const uploadSchema = z.object({
  merchantId: z.string().min(1),
  altText: z.string().optional()
});

export async function uploadMediaAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = uploadSchema.parse({
    merchantId: formData.get("merchantId"),
    altText: formData.get("altText") || undefined
  });
  const file = formData.get("file");

  assertMerchantAccess(session, data.merchantId);

  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("File is required");
  }

  if (!imageMimeTypes.has(file.type)) {
    throw new Error("僅支援 JPG、PNG、WebP 圖片");
  }

  if (file.size > maxUploadSize) {
    throw new Error("圖片大小不可超過 5MB");
  }

  const storageProvider = getStorageProvider();
  const storedObject = await storageProvider.putObject({
    filename: file.name,
    contentType: file.type,
    body: await file.arrayBuffer()
  });

  await prisma.media.create({
    data: {
      merchantId: data.merchantId,
      url: storedObject.url,
      pathname: storedObject.pathname,
      provider: storedObject.provider,
      fileName: storedObject.fileName,
      altText: data.altText || null,
      mimeType: storedObject.contentType,
      size: storedObject.size
    }
  });

  revalidatePath("/admin/media");
  redirect("/admin/media");
}
