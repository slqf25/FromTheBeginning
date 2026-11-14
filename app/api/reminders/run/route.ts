import { and, eq, notExists } from "drizzle-orm";
import { getDb } from "@/db";
import { checkins, participants, reminderLogs } from "@/db/schema";
import { campaign } from "@/features/campaign/config";

// Brevo's free plan caps transactional email at 300/day. The reminder window
// spans two days, so capping each run lets the remaining recipients (already
// excluded via reminderLogs once sent) roll over to the next day's run.
const DAILY_EMAIL_LIMIT = 300;

function activeReminderWeek(now = new Date()) {
  for (const week of campaign.weeks) {
    const start = new Date(`${week.isoDate}T00:00:00+08:00`);
    const reminderDay = new Date(start.getTime() + 5 * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    if (now >= reminderDay && now < end) return week.number;
  }
  return null;
}

export async function POST(request: Request) {
  const runtime = process.env;
  const cronSecret = runtime.CRON_SECRET || runtime.REMINDER_CRON_SECRET;
  const authorized = Boolean(cronSecret) && (
    request.headers.get("authorization") === `Bearer ${cronSecret}` ||
    request.headers.get("x-reminder-key") === cronSecret
  );
  if (!authorized) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!runtime.BREVO_API_KEY || !runtime.REMINDER_FROM) return Response.json({ error: "Email service is not configured" }, { status: 503 });
  const fromMatch = runtime.REMINDER_FROM.match(/^(.*?)\s*<(.+)>$/);
  const sender = fromMatch ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() } : { email: runtime.REMINDER_FROM };
  const week = activeReminderWeek();
  if (!week) return Response.json({ ok: true, sent: 0, note: "No reminder window is active" });
  const db = getDb();
  const eligible = await db.select().from(participants).where(and(eq(participants.remindersEnabled, true), notExists(db.select().from(checkins).where(and(eq(checkins.participantId, participants.id), eq(checkins.week, week)))), notExists(db.select().from(reminderLogs).where(and(eq(reminderLogs.participantId, participants.id), eq(reminderLogs.week, week))))));
  const recipients = eligible.slice(0, DAILY_EMAIL_LIMIT);
  let sent = 0;
  for (const person of recipients) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": runtime.BREVO_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ sender, to: [{ email: person.email, name: person.name }], subject: `起初的心｜第 ${week} 周还在等你`, htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#2f2a26"><p style="color:#98613c;letter-spacing:2px;font-size:12px">FROM THE BEGINNING</p><h1 style="font-size:28px">${person.name}，这一周还在等你</h1><p style="line-height:1.8">在期限结束前，回来观看第 ${week} 周的影片并留下你的打卡吧。愿你在忙碌里，也能为心留一个位置。</p><p><a href="${new URL(request.url).origin}" style="display:inline-block;background:#713d2f;color:white;padding:12px 20px;border-radius:999px;text-decoration:none">回到四周旅程</a></p></div>` }) });
    const status = response.ok ? "sent" : `failed:${response.status}`;
    await db.insert(reminderLogs).values({ participantId: person.id, week, status }).onConflictDoNothing();
    if (response.ok) sent++;
  }
  return Response.json({ ok: true, week, sent, considered: recipients.length, remaining: eligible.length - recipients.length });
}

// Vercel Cron invokes routes with GET; keep POST for manual/local execution.
export const GET = POST;
