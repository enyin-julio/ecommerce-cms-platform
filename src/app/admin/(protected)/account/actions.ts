"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12),
    confirmPassword: z.string().min(1)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch"
  })
  .refine((data) => isStrongPassword(data.newPassword), {
    path: ["newPassword"],
    message: "weak_password"
  });

export async function updateAdminPasswordAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect("/admin/account?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    },
    select: {
      id: true,
      passwordHash: true,
      role: true
    }
  });

  if (!user || user.role === "customer") {
    redirect("/admin/login");
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    redirect("/admin/account?error=current");
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword)
    }
  });

  redirect("/admin/account?saved=1");
}

function isStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
