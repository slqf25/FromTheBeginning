import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { weekVideos } from "@/db/schema";
import { getCurrentAdmin } from "@/features/admin/server/admin-session";
import { youtubeEmbedUrl } from "@/features/campaign/config";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "无权限" }, { status: 403 });

  const rows = await getDb().select().from(weekVideos).orderBy(asc(weekVideos.week));
  return Response.json({ videos: rows });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "无权限" }, { status: 403 });

  const data = await request.json() as { week?: number; videoUrl?: string };
  const week = Number(data.week);
  if (![1, 2, 3, 4].includes(week)) return Response.json({ error: "周次无效" }, { status: 400 });

  const videoUrl = String(data.videoUrl || "").trim();
  if (!videoUrl) return Response.json({ error: "请输入链接" }, { status: 400 });
  if (!youtubeEmbedUrl(videoUrl)) return Response.json({ error: "无法识别这个链接，请确认是 YouTube 或 Vimeo 网址" }, { status: 400 });

  const db = getDb();
  await db.insert(weekVideos).values({ week, videoUrl, updatedAt: new Date() })
    .onConflictDoUpdate({ target: weekVideos.week, set: { videoUrl, updatedAt: new Date() } });

  const [row] = await db.select().from(weekVideos).where(eq(weekVideos.week, week)).limit(1);
  return Response.json({ ok: true, video: row });
}

export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "无权限" }, { status: 403 });
  if (admin.role !== "developer") return Response.json({ error: "只有开发者权限可以清空链接" }, { status: 403 });

  const data = await request.json() as { week?: number };
  const week = Number(data.week);
  if (![1, 2, 3, 4].includes(week)) return Response.json({ error: "周次无效" }, { status: 400 });

  const db = getDb();
  await db.insert(weekVideos).values({ week, videoUrl: null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: weekVideos.week, set: { videoUrl: null, updatedAt: new Date() } });

  return Response.json({ ok: true });
}
