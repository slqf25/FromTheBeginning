import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const data = await request.json() as { email?: string; password?: string };
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");
  if (!email || !password) return Response.json({ error: "请输入邮箱和密码" }, { status: 400 });

  const rows = await getDb().select().from(admins).where(eq(admins.email, email)).limit(1);
  const admin = rows[0];
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return Response.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  const token = createAdminSessionToken(admin.email);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
  return Response.json({ ok: true });
}
