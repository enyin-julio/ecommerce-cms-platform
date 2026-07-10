import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  verifySessionToken,
  type AdminSession
} from "@/lib/session-token";

export const CUSTOMER_SESSION_COOKIE_NAME = "commerce_customer_session";

export type CustomerSession = AdminSession & {
  role: "customer";
};

export async function getCurrentCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role !== "customer") {
    return null;
  }

  return session as CustomerSession;
}

export async function requireCustomerSession() {
  const session = await getCurrentCustomerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function setCustomerSessionCookie(session: CustomerSession) {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);
  const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));

  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    expires: new Date(session.expiresAt)
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
