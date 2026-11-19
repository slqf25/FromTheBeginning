import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { participants } from "@/db/schema";
import { getCurrentParticipant, SESSION_COOKIE } from "@/features/campaign/server/participant-session";

export async function POST(request: Request) {
  const data = await request.formData();
  const mode = String(data.get("mode") || "register");
  const email = String(data.get("email") || "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "email_invalid" }, { status: 400 });

  try {
    const db = getDb();

    if (mode === "login") {
      const existing = await db.select().from(participants).where(eq(participants.email, email)).limit(1);
      if (!existing[0]) return Response.json({ error: "email_not_found" }, { status: 404 });
      const sessionToken = crypto.randomUUID();
      await db.update(participants).set({ sessionToken, updatedAt: new Date() }).where(eq(participants.email, email));
      (await cookies()).set(SESSION_COOKIE, sessionToken, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 120 });
      return Response.json({ ok: true });
    }

    const name = String(data.get("name") || "").trim().slice(0, 80);
    const remindersEnabled = data.get("reminders") === "on";
    if (name.length < 2) return Response.json({ error: "name_required" }, { status: 400 });
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
    console.error("Participant session request failed", error);
    return Response.json({ error: "database_unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const participant = await getCurrentParticipant();
  if (!participant) return Response.json({ error: "login_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { remindersEnabled?: boolean } | null;
  if (!body || typeof body.remindersEnabled !== "boolean") return Response.json({ error: "invalid_request" }, { status: 400 });
  const db = getDb();
  await db.update(participants).set({ remindersEnabled: body.remindersEnabled, updatedAt: new Date() }).where(eq(participants.id, participant.id));
  return Response.json({ ok: true, remindersEnabled: body.remindersEnabled });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
