import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { checkins, participants, weekVideos } from "@/db/schema";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const db = getDb();
  const [people, allCheckins, videos] = await Promise.all([
    db.select().from(participants).orderBy(asc(participants.name)),
    db.select().from(checkins),
    db.select().from(weekVideos),
  ]);
  const rows = people.map((person) => {
    const records = allCheckins.filter((item) => item.participantId === person.id);
    return { id: person.id, name: person.name, email: person.email, remindersEnabled: person.remindersEnabled, createdAt: person.createdAt.toISOString(), checkins: records.map((item) => item.week), gift: records.length === 4 ? "large" as const : records.length > 0 ? "small" as const : "none" as const, giftCollectedAt: person.giftCollectedAt ? person.giftCollectedAt.toISOString() : null };
  });
  return <AdminDashboard rows={rows} videos={videos} adminName={admin.displayName || admin.email} isDeveloper={admin.role === "developer"} />;
}
