import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function getCurrentAdminEmail() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function getCurrentAdmin() {
  const email = await getCurrentAdminEmail();
  if (!email) return null;
  const rows = await getDb().select().from(admins).where(eq(admins.email, email)).limit(1);
  return rows[0] ?? null;
}
