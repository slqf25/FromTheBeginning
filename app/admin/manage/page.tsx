import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";
import { AdminManage } from "@/features/admin/components/admin-manage";

export const dynamic = "force-dynamic";

export default async function AdminManagePage() {
  const current = await getCurrentAdmin();
  if (!current) redirect("/admin/login");
  if (current.role !== "developer") redirect("/admin");

  const rows = await getDb().select({ email: admins.email, displayName: admins.displayName, role: admins.role, createdAt: admins.createdAt }).from(admins).orderBy(asc(admins.email));
  const list = rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  return <AdminManage initialAdmins={list} currentEmail={current.email} />;
}
