import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type AdminSession
} from "@/lib/session-token";

export { SESSION_COOKIE_NAME, verifySessionToken, type AdminSession };

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export async function setAdminSessionCookie(session: AdminSession) {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt)
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}
