import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-token";

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

  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "customer",
    merchantId: null,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7
  } as const;
  const token = await createSessionToken(session);
  const response = NextResponse.redirect(new URL("/account", request.url), 303);

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor((session.expiresAt - Date.now()) / 1000),
    expires: new Date(session.expiresAt)
  });

  return response;
}
