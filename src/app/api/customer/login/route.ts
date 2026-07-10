import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { setCustomerSessionCookie } from "@/lib/customer-session";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  }

  const data = parsed.data;
  const user = await prisma.user.findUnique({
    where: {
      email: data.email.toLowerCase()
    }
  });

  if (!user || user.role !== "customer" || !verifyPassword(data.password, user.passwordHash)) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  }

  await setCustomerSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "customer",
    merchantId: null,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7
  });

  return NextResponse.redirect(new URL("/account", request.url), 303);
}
