import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type AdminSession
} from "@/lib/session-token";

export const CUSTOMER_SESSION_COOKIE_NAME = "commerce_customer_session_v2";
export const LEGACY_CUSTOMER_SESSION_COOKIE_NAMES = ["commerce_customer_session"];

export type CustomerSession = AdminSession & {
  role: "customer";
};

const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const CUSTOMER_SESSION_COOKIE_PATHS = ["/", "/account", "/account/orders"];

export function getCustomerSessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  };
}

export function getExpiredCustomerSessionCookieOptions(path = "/") {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path,
    maxAge: 0,
    expires: new Date(0)
  };
}

export function serializeExpiredCustomerSessionCookie(name: string, path: string) {
  const attributes = [
    `${name}=`,
    `Path=${path}`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function createCustomerSessionPayload(user: {
  id: string;
  email: string;
  name: string;
}) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "customer" as const,
    merchantId: null,
    expiresAt: Date.now() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000
  };
}

export async function getCurrentCustomer() {
  noStore();

  const cookieStore = await cookies();
  const tokens = [
    ...cookieStore.getAll(CUSTOMER_SESSION_COOKIE_NAME).map((cookie) => cookie.value),
    ...LEGACY_CUSTOMER_SESSION_COOKIE_NAMES.flatMap((name) =>
      cookieStore.getAll(name).map((cookie) => cookie.value)
    ),
    ...cookieStore.getAll(SESSION_COOKIE_NAME).map((cookie) => cookie.value)
  ];

  for (const token of tokens) {
    const session = await verifySessionToken(token);

    if (session?.role === "customer") {
      return session as CustomerSession;
    }
  }

  return null;
}

export const getCurrentCustomerSession = getCurrentCustomer;

export async function requireCustomerSession() {
  const session = await getCurrentCustomer();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function setCustomerSessionCookie(session: CustomerSession) {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);
  const options = getCustomerSessionCookieOptions(session.expiresAt);

  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, options);
  cookieStore.set(SESSION_COOKIE_NAME, token, options);
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  const options = getExpiredCustomerSessionCookieOptions();

  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, "", options);
  for (const name of LEGACY_CUSTOMER_SESSION_COOKIE_NAMES) {
    cookieStore.set(name, "", options);
  }
  cookieStore.set(SESSION_COOKIE_NAME, "", options);
}
