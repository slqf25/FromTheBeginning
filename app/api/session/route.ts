import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { participants } from "@/db/schema";
import { SESSION_COOKIE } from "@/features/campaign/server/participant-session";

export async function POST(request: Request) {
  const data = await request.formData();
  const name = String(data.get("name") || "").trim().slice(0, 80);
  const email = String(data.get("email") || "").trim().toLowerCase().slice(0, 160);
  const remindersEnabled = data.get("reminders") === "on";
  if (name.length < 2) return Response.json({ error: "name_required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "email_invalid" }, { status: 400 });

  try {
    const db = getDb();
    const existing = await db.select().from(participants).where(eq(participants.email, email)).limit(1);
    const id = existing[0]?.id ?? crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    await db.insert(participants).values({ id, name, email, sessionToken, remindersEnabled }).onConflictDoUpdate({
      target: participants.email,
      set: { name, sessionToken, remindersEnabled, updatedAt: new Date() },
    });
    (await cookies()).set(SESSION_COOKIE, sessionToken, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 120 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Participant registration failed", error);
    return Response.json({ error: "database_unavailable" }, { status: 503 });
  }
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
