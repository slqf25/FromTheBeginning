import { getDb } from "@/db";
import { checkins } from "@/db/schema";
import { openWeekNumbers } from "@/features/campaign/config";
import { getCurrentParticipant } from "@/features/campaign/server/participant-session";

export async function POST(request: Request) {
  const participant = await getCurrentParticipant();
  if (!participant) return Response.json({ error: "login_required" }, { status: 401 });
  const { week } = await request.json() as { week?: number };
  const weekNumber = Number(week);
  if (![1, 2, 3, 4].includes(weekNumber)) return Response.json({ error: "invalid_week" }, { status: 400 });
  if (!openWeekNumbers(process.env).includes(weekNumber)) return Response.json({ error: "week_unavailable" }, { status: 403 });
  await getDb().insert(checkins).values({ participantId: participant.id, week: weekNumber }).onConflictDoNothing();
  return Response.json({ ok: true });
}
