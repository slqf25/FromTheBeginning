import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ email: string }> }) {
  const current = await getCurrentAdmin();
  if (!current || current.role !== "developer") return Response.json({ error: "无权限" }, { status: 403 });

  const target = decodeURIComponent((await params).email).toLowerCase();
  if (target === current.email) return Response.json({ error: "不能删除自己当前登录的账号" }, { status: 400 });

  const db = getDb();
  const targetRow = (await db.select().from(admins).where(eq(admins.email, target)).limit(1))[0];
  if (!targetRow) return Response.json({ error: "找不到此管理员" }, { status: 404 });

  if (targetRow.role === "developer") {
    const developerCount = (await db.select({ email: admins.email }).from(admins).where(eq(admins.role, "developer"))).length;
    if (developerCount <= 1) return Response.json({ error: "至少需要保留一个开发者权限的管理员" }, { status: 400 });
  }

  await db.delete(admins).where(eq(admins.email, target));
  return Response.json({ ok: true });
}
