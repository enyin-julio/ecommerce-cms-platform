"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "@/lib/session";

export async function logoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
