import { redirect } from "next/navigation";
import { clearCustomerSessionCookie } from "@/lib/customer-session";

export async function GET() {
  await clearCustomerSessionCookie();
  redirect("/");
}
