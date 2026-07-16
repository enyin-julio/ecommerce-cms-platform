"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertMerchantAccess, requireAdminSession } from "@/lib/rbac";
import { getStorePolicyDefinitionByKey, storePolicyKeys } from "@/lib/store-policy-types";

const storePolicySchema = z.object({
  merchantId: z.string().min(1),
  policyKey: z.enum(storePolicyKeys),
  content: z.string().optional()
});

export async function updateStorePolicyAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = storePolicySchema.parse({
    merchantId: formData.get("merchantId"),
    policyKey: formData.get("policyKey"),
    content: formData.get("content") || ""
  });
  const policyDefinition = getStorePolicyDefinitionByKey(data.policyKey);

  if (!policyDefinition) {
    throw new Error("找不到政策類型");
  }

  assertMerchantAccess(session, data.merchantId);

  await prisma.storePolicy.upsert({
    where: {
      merchantId: data.merchantId
    },
    create: {
      merchantId: data.merchantId,
      [data.policyKey]: data.content?.trim() || null
    },
    update: {
      [data.policyKey]: data.content?.trim() || null
    }
  });

  revalidatePath("/admin/policies");
  revalidatePath(`/policies/${policyDefinition.slug}`);
  redirect(`/admin/policies?merchantId=${data.merchantId}&tab=${policyDefinition.slug}&saved=1`);
}
