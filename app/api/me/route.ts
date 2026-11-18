import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { checkins, weekVideos } from "@/db/schema";
import { getCurrentParticipant } from "@/features/campaign/server/participant-session";
import { availableWeekNumbers, nextCampaignTransition, openWeekNumbers, youtubeEmbedUrl } from "@/features/campaign/config";

export async function GET() {
  const participant = await getCurrentParticipant();
  const db = getDb();
  const [checkinRows, videoRows] = await Promise.all([
    participant ? db.select({ week: checkins.week }).from(checkins).where(eq(checkins.participantId, participant.id)).orderBy(asc(checkins.week)) : Promise.resolve([]),
    db.select().from(weekVideos),
  ]);
  const runtime = process.env;
  const availableWeeks = availableWeekNumbers(runtime);
  const openWeeks = openWeekNumbers(runtime);
  const currentWeek = openWeeks.length === 1 ? openWeeks[0] : null;
  const videoUrls = Object.fromEntries(videoRows.map((row) => [String(row.week), youtubeEmbedUrl(row.videoUrl)]).filter((entry) => entry[1]));
  return Response.json({ participant: participant ? { id: participant.id, name: participant.name, email: participant.email, checkins: checkinRows.map((row) => row.week), remindersEnabled: participant.remindersEnabled } : null, videoUrls, availableWeeks, openWeeks, currentWeek, nextTransitionAt: nextCampaignTransition(runtime) });
}
