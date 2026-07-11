import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  CUSTOMER_SESSION_COOKIE_PATHS,
  createCustomerSessionPayload,
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
  LEGACY_CUSTOMER_SESSION_COOKIE_NAMES,
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
  const options = getCustomerSessionCookieOptions(session.expiresAt);

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
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, token, options);
  response.cookies.set(SESSION_COOKIE_NAME, token, options);

  return response;
}
