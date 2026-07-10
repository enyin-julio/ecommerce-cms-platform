import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/rbac";

export default async function ProtectedAdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireAdminSession();

  return <AdminShell session={session}>{children}</AdminShell>;
}
