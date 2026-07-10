import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getExpiredCustomerSessionCookieOptions
} from "@/lib/customer-session";
import { SESSION_COOKIE_NAME } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  const options = getExpiredCustomerSessionCookieOptions();

  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", options);
  response.cookies.set(SESSION_COOKIE_NAME, "", options);

  return response;
}
