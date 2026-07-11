import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  CUSTOMER_SESSION_COOKIE_PATHS,
  createCustomerSessionPayload,
  LEGACY_CUSTOMER_SESSION_COOKIE_NAMES,
  serializeCustomerSessionCookie,
  serializeExpiredCustomerSessionCookie
} from "@/lib/customer-session";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-token";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional()
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/register?error=invalid", request.url), 303);
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (existingUser) {
    return NextResponse.redirect(new URL("/register?error=invalid", request.url), 303);
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

  const session = createCustomerSessionPayload(user);
  const token = await createSessionToken(session);
  const response = NextResponse.redirect(new URL("/account", request.url), 303);

  for (const name of LEGACY_CUSTOMER_SESSION_COOKIE_NAMES) {
    response.headers.append("Set-Cookie", serializeExpiredCustomerSessionCookie(name, "/"));
  }
  for (const path of CUSTOMER_SESSION_COOKIE_PATHS.filter((cookiePath) => cookiePath !== "/")) {
    response.headers.append(
      "Set-Cookie",
      serializeExpiredCustomerSessionCookie(CUSTOMER_SESSION_COOKIE_NAME, path)
    );
    for (const name of LEGACY_CUSTOMER_SESSION_COOKIE_NAMES) {
      response.headers.append("Set-Cookie", serializeExpiredCustomerSessionCookie(name, path));
    }
    response.headers.append(
      "Set-Cookie",
      serializeExpiredCustomerSessionCookie(SESSION_COOKIE_NAME, path)
    );
  }
  response.headers.append(
    "Set-Cookie",
    serializeCustomerSessionCookie(CUSTOMER_SESSION_COOKIE_NAME, token, session.expiresAt)
  );
  response.headers.append(
    "Set-Cookie",
    serializeCustomerSessionCookie(SESSION_COOKIE_NAME, token, session.expiresAt)
  );

  return response;
}
