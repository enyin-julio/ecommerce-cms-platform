import type { UserRole } from "@/lib/domain-types";
import { getSessionSecret } from "@/lib/env";

export const SESSION_COOKIE_NAME = "commerce_admin_session";

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  merchantId: string | null;
  expiresAt: number;
};

const encoder = new TextEncoder();

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function signPayload(payload: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));

  return base64UrlEncode(signature);
}

export async function createSessionToken(session: AdminSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload);

  return `${payload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<AdminSession | null> {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AdminSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
