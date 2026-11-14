import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { checkins } from "@/db/schema";
import { getCurrentParticipant } from "@/features/campaign/server/participant-session";
import { availableWeekNumbers, openWeekNumbers, youtubeEmbedUrl } from "@/features/campaign/config";

export async function GET() {
  const participant = await getCurrentParticipant();
  const rows = participant ? await getDb().select({ week: checkins.week }).from(checkins).where(eq(checkins.participantId, participant.id)).orderBy(asc(checkins.week)) : [];
  const runtime = process.env;
  const availableWeeks = availableWeekNumbers(runtime);
  const openWeeks = openWeekNumbers(runtime);
  const videoUrls = Object.fromEntries(availableWeeks.map((week) => [String(week), youtubeEmbedUrl(runtime[`VIDEO_URL_${week}`])]).filter((entry) => entry[1]));
  return Response.json({ participant: participant ? { id: participant.id, name: participant.name, email: participant.email, checkins: rows.map((row) => row.week) } : null, videoUrls, availableWeeks, openWeeks });
}
