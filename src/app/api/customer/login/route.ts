import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  CUSTOMER_SESSION_COOKIE_PATHS,
  createCustomerSessionPayload,
  CUSTOMER_SESSION_COOKIE_NAME,
  CUSTOMER_SESSION_COOKIE_DOMAINS,
  LEGACY_CUSTOMER_SESSION_COOKIE_NAMES,
  serializeCustomerSessionCookie,
  serializeExpiredCustomerSessionCookie
} from "@/lib/customer-session";
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

  const session = createCustomerSessionPayload(user);
  const token = await createSessionToken(session);
  const response = NextResponse.redirect(new URL("/account", request.url), 303);
  const cookieNamesToClear = [
    CUSTOMER_SESSION_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    ...LEGACY_CUSTOMER_SESSION_COOKIE_NAMES
  ];

  for (const path of CUSTOMER_SESSION_COOKIE_PATHS) {
    for (const name of cookieNamesToClear) {
      for (const domain of CUSTOMER_SESSION_COOKIE_DOMAINS) {
        response.headers.append(
          "Set-Cookie",
          serializeExpiredCustomerSessionCookie(name, path, domain)
        );
      }
    }
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
