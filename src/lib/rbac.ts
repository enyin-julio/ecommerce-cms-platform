import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/domain-types";
import { getCurrentAdminSession } from "@/lib/session";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function denyAccess(): never {
  redirect("/admin/forbidden");
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();

  if (!session || session.role === "customer") {
    redirect("/admin/login");
  }

  return session;
}

export async function requireRoles(roles: UserRole[]) {
  const session = await requireAdminSession();

  if (!roles.includes(session.role)) {
    throw new ForbiddenError();
  }

  return session;
}

export function canAccessMerchantResource(
  session: Awaited<ReturnType<typeof requireAdminSession>>,
  merchantId: string
) {
  return session.role === "admin" || session.merchantId === merchantId;
}

export function assertMerchantAccess(
  session: Awaited<ReturnType<typeof requireAdminSession>>,
  merchantId: string
) {
  if (!canAccessMerchantResource(session, merchantId)) {
    denyAccess();
  }
}
