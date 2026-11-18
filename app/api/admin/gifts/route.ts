import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { participants } from "@/db/schema";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "无权限" }, { status: 403 });

  const data = await request.json() as { participantId?: string; collected?: boolean };
  const participantId = String(data.participantId || "");
  if (!participantId) return Response.json({ error: "缺少参与者 ID" }, { status: 400 });

  const db = getDb();
  await db.update(participants).set({ giftCollectedAt: data.collected ? new Date() : null }).where(eq(participants.id, participantId));

  const [row] = await db.select({ id: participants.id, giftCollectedAt: participants.giftCollectedAt }).from(participants).where(eq(participants.id, participantId)).limit(1);
  return Response.json({ ok: true, participant: row });
}
