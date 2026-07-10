"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { UserRole } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setAdminSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined
  });

  if (!parsed.success) {
    redirect("/admin/login?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase()
    }
  });

  if (!user || user.role === "customer") {
    redirect("/admin/login?error=invalid");
  }

  const isValidPassword = verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    redirect("/admin/login?error=invalid");
  }

  await setAdminSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    merchantId: user.merchantId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8
  });

  const nextPath =
    parsed.data.next && parsed.data.next.startsWith("/admin")
      ? parsed.data.next
      : "/admin";

  redirect(nextPath);
}
