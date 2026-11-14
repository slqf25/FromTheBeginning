import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { hashPassword } from "@/lib/admin-auth";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";

export async function GET() {
  const current = await getCurrentAdmin();
  if (!current || current.role !== "developer") return Response.json({ error: "无权限" }, { status: 403 });

  const rows = await getDb().select({ email: admins.email, displayName: admins.displayName, role: admins.role, createdAt: admins.createdAt }).from(admins).orderBy(asc(admins.email));
  return Response.json({ admins: rows });
}

export async function POST(request: Request) {
  const current = await getCurrentAdmin();
  if (!current || current.role !== "developer") return Response.json({ error: "无权限" }, { status: 403 });

  const data = await request.json() as { email?: string; password?: string; displayName?: string; role?: string };
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");
  const displayName = data.displayName ? String(data.displayName).trim().slice(0, 80) : null;
  const role = data.role === "developer" ? "developer" : "admin";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "请填写有效的 Email" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "密码至少需要 8 位" }, { status: 400 });

  try {
    await getDb().insert(admins).values({ email, passwordHash: hashPassword(password), displayName, role });
  } catch {
    return Response.json({ error: "该邮箱已经是管理员" }, { status: 409 });
  }
  return Response.json({ ok: true });
}
