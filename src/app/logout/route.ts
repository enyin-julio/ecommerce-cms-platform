import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE_PATHS,
  CUSTOMER_SESSION_COOKIE_NAME,
  getExpiredCustomerSessionCookieOptions,
  LEGACY_CUSTOMER_SESSION_COOKIE_NAMES,
  serializeExpiredCustomerSessionCookie
} from "@/lib/customer-session";
import { SESSION_COOKIE_NAME } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  const rootOptions = getExpiredCustomerSessionCookieOptions();

  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", rootOptions);
  for (const name of LEGACY_CUSTOMER_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, "", rootOptions);
  }
  response.cookies.set(SESSION_COOKIE_NAME, "", rootOptions);

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

  return response;
}
