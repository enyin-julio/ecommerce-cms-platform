"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional()
});

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await requireCustomerSession();
  const data = profileSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined
  });

  await prisma.user.update({
    where: {
      id: session.userId
    },
    data: {
      name: data.name,
      phone: data.phone || null,
      address: data.address || null
    }
  });

  revalidatePath("/account");
}
