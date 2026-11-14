import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { participants } from "@/db/schema";

export const SESSION_COOKIE = "beginning_session";

export async function getCurrentParticipant() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await getDb().select().from(participants).where(eq(participants.sessionToken, token)).limit(1);
  return rows[0] ?? null;
}
