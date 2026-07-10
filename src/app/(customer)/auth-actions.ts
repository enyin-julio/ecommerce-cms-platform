"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearCustomerSessionCookie,
  createCustomerSessionPayload,
  setCustomerSessionCookie
} from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional()
});

export async function customerLoginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const data = parsed.data;
  const user = await prisma.user.findUnique({
    where: {
      email: data.email.toLowerCase()
    }
  });

  if (!user || user.role !== "customer" || !verifyPassword(data.password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await setCustomerSessionCookie(createCustomerSessionPayload(user));

  redirect("/account");
}

export async function customerRegisterAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (existingUser) {
    redirect("/register?error=invalid");
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: normalizedEmail,
      passwordHash: hashPassword(data.password),
      role: "customer",
      phone: data.phone || null,
      address: data.address || null
    }
  });

  await setCustomerSessionCookie(createCustomerSessionPayload(user));

  redirect("/account");
}

export async function customerLogoutAction() {
  await clearCustomerSessionCookie();
  redirect("/");
}
